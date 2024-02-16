module.exports = function (app) {
    const config = app.get('config');
    const logger = app.get('logger');

    app.get('/api/news', async (req, res) => {
        try {
            let Parser = require('rss-parser');
            let parser = new Parser();
            let feed = await parser.parseURL(config.news.url);

            return res.ok(feed);
        } catch(err) {
            logger.error(err);
            //We don't want error on the FE if news are not loaded
            return res.ok([]);
        }
    });
}