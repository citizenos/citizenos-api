'use strict';

const Mailgun = require('mailgun.js');
const formData = require('form-data');
const addrs = require('email-addresses');
const inlineCss = require('inline-css');
const { convert } = require('html-to-text');
const noKey = 'campaign-mailgun: API key not set';

function mailgun (options) {
  if (!options) {
    options = {};
  }
  if (!options.apiKey) {
    warnNoKey();
    return {
      name: 'mailgun',
      send: sendNoKey
    };
  }
  return {
    name: 'mailgun',
    tweakPlaceholder: tweakPlaceholder,
    send: send
  };

  function tweakPlaceholder (property, raw) {
    return '%recipient.' + property + '%';
  }

  function warnNoKey () {
    console.warn(noKey);
  }

  function sendNoKey (model) {
    warnNoKey();
    throw new Error(noKey);
  }

  async function send (model) {
    const provider = model.provider || {};
    const providerTags = provider.tags || [];
    const merge = provider.merge || {};
    const domain = addrs.parseOneAddress(model.from).domain;
    const authority = model.authority || options.authority
    const mailgun = new Mailgun(formData);
    const client = mailgun.client({
      key: options.apiKey,
      username: options.username || 'api'
    });

    const html = await inlineHtml();
    const images = await getImages();
    const attachments = await getAttachments();

    return post(html, images, attachments);

    function inlineHtml () {
      const config = {
        url: authority
      };
      return inlineCss(model.html, config);
    }

    function getImages () {
      const images = model.images ? model.images : [];
      if (model._header) {
        images.unshift({
          name: '_header',
          data: model._header.data,
          mime: model._header.mime
        });
      }
      return Promise.all(images.map((image) => {
        return {
          data: Buffer.from(image.data, 'base64'),
          filename: image.name,
          contentType: image.mime
        };
      }));
    }

    function getAttachments () {
      const attachments = model.attachments ? model.attachments : [];
      return Promise.all(attachments.map((attachment) => {
        return {
          data: attachment.file,
          filename: attachment.name
        };
      }));
    }

    async function post (html, images, attachments) {
      const inferConfig = {
        wordwrap: 130,
        selectors: [{
            selector:'a',
            options: {
              baseUrl: authority,
              hideLinkHrefIfSameAsText:true
            }
          },{
            selector: 'img',
            options: {
              baseUrl: authority
            }
          }
        ]
      };
      const inferredText = convert(html, inferConfig);
      const tags = [model._template].concat(providerTags);
      const batches = getRecipientBatches();
      expandWildcard(model.to, model.cc, model.bcc);

      const results = await Promise.allSettled(batches.map(async (batch) => {
        return postBatch(batch);
      }));

      return results;

      async function postBatch (batch) {
        const req = {
          from: model.from,
          to: batch,
          cc: model.cc,
          bcc: model.bcc,
          subject: model.subject,
          html: html,
          text: inferredText,
          inline: images.slice(),
          attachment: attachments.slice(),
          'o:tag': tags.slice(),
          'o:tracking': 'false',
          'o:tracking-clicks': 'false',
          'o:tracking-opens': 'false',
          'recipient-variables': parseMergeVariables(batch, model.cc, model.bcc)
        };
        if (model.replyTo) {
          req["h:Reply-To"] = model.replyTo;
        }

        return client.messages.create(domain, req);
      }
    }
    function getRecipientBatches () {
      const size = 250; // "Note: The maximum number of recipients allowed for Batch Sending is 1,000."
      const batches = [];
      for (let i = 0; i < model.to.length; i += size) {
        batches.push(model.to.slice(i, i + size));
      }
      return batches;
    }
    function parseMergeVariables (to, cc, bcc) {
      const variables = {};
      to
        .concat(cc)
        .concat(bcc)
        .forEach(addVariables);
      return JSON.stringify(variables);
      function addVariables (recipient) {
        if (merge[recipient]) {
          variables[recipient] = merge[recipient];
        }
      }
    }
    function expandWildcard (to, cc, bcc) {
      if ('*' in merge) {
        wildcarding();
      }
      function wildcarding () {
        const wildcard = merge['*'];
        to
          .concat(cc)
          .concat(bcc)
          .forEach(addWildcardToRecipient);
        function addWildcardToRecipient (recipient) {
          Object.keys(wildcard).forEach(addWildcardKeyToRecipient);
          function addWildcardKeyToRecipient (key) {
            // don't override: wildcard has default values
            if (!merge[recipient]) {
              merge[recipient] = {};
            }
            if (!Object.prototype.hasOwnProperty.call(merge[recipient], key)) {
              merge[recipient][key] = wildcard[key];
            }
          }
        }
      }
    }
  }
}

module.exports = mailgun;
