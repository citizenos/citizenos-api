module.exports = function (app) {
    const config = app.get('config');

    app.get('/api/news', async (req, res, next) => {
        try {
            let Parser = require('rss-parser');
            let parser = new Parser();
            let feed = await parser.parseURL(config.news.url);

            return res.ok(feed);
        } catch(err) {
            next(err);
        }
    });
}