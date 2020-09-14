'use strict';

const request = require('supertest');
const app = require('../../../app');

const report = async function (agent, headers, payload) {
    const path = '/api/internal/report';
    return agent
            .post(path)
            .set(headers)
            .send(JSON.stringify(payload))
            .expect(200);
};


suite('Internal', function () {

    suite('Report', function () {

        test('Success', async function () {
            const agent = request.agent(app);

            const headers = {
                host: 'api.citizenos.com',
                'cf-ipcountry': 'EE',
                'x-forwarded-for': '90.191.10.55, 172.69.138.33',
                'cf-ray': '4da4c158a8ddb63f-TLL',
                'x-forwarded-proto': 'https',
                'cf-visitor': '{"scheme":"https"}',
                origin: 'https://app.citizenos.com',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36',
                'content-type': 'application/csp-report',
                accept: '*/*',
                referer: 'https://app.citizenos.com/id/tenislandproject',
                'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8,et;q=0.7,fi;q=0.6',
                'cf-connecting-ip': '90.191.10.55',
                'cdn-loop': 'cloudflare',
                'x-request-id': '322aef4a-36da-4d91-95f2-763d42637568',
                'x-forwarded-port': '443',
                via: '1.1 vegur',
                'connect-time': '0',
                'x-request-start': '1558422885406',
                'total-route-time': '0'
            };

            const cspReport = {
                'csp-report': {
                    'document-uri': 'https://app.citizenos.com/id/tenislandproject',
                    referrer: 'https://web.unep.org/youngchampions/2019/bio/asia-pacific',
                    'violated-directive': 'font-src',
                    'effective-directive': 'font-src',
                    'original-policy': 'default-src \'self\'; img-src *; script-src \'self\' https://cdn.crowdin.com https://apis.google.com https://www.google-analytics.com; style-src \'self\' https://fonts.googleapis.com \'sha256-swnxFqaff0i3bsLtJDRpMd5tZFLBnglxSxSqPSAWdIk=\'; font-src \'self\' https://fonts.gstatic.com; connect-src \'self\' https://id.citizenos.com https://api.citizenos.com https://sentry.io https://graph.microsoft.com https://www.google-analytics.com; base-uri \'self\'; object-src \'none\'; frame-src https://p.citizenos.com/ https://accounts.google.com/ https://docs.google.com; report-uri https://api.citizenos.com/api/internal/report;',
                    disposition: 'report',
                    'blocked-uri': 'data',
                    'status-code': 0,
                    'script-sample': '<script>alert("ASD");</script>'
                }
            };

            return report(agent, headers, cspReport);
        });

    });

});
