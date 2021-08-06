'use strict';

/**
 * CitizenOS Etherpad testcases
 */

suite('cosEtherpad', function () {

    const assert = require('chai').assert;
    const uuid = require('uuid');

    const app = require('../../app');
    const models = app.get('models');
    const config = app.get('config');
    const cosEtherpad = app.get('cosEtherpad');
    const jwt = app.get('jwt');

    const Topic = models.Topic;

    suite('createTopic', function () {

        test('Success', async function () {
            const topicId = uuid.v4();

            return cosEtherpad.createTopic(topicId);
        });

    });

    suite('getUserAccessUrl', function () {

        test('Success', async function () {
            const topic = {
                padUrl: 'https://random.path.com/p/testpadid'
            };

            const user = {
                id: 'testUserId',
                name: 'Test Name',
                language: 'et'
            };

            const parsedUrl = new URL(cosEtherpad.getUserAccessUrl(topic, user.id, user.name, user.language));
            assert.equal(topic.padUrl, parsedUrl.protocol + '//' + parsedUrl.host + parsedUrl.pathname);
            assert.equal(user.language, parsedUrl.searchParams.get('lang'));

            const jwtPayload = jwt.decode(parsedUrl.searchParams.get('jwt'));
            delete user.language; // Remove, as it's not in the JWT payload
            assert.deepEqual(jwtPayload.user, user);
        });

    });

    suite('getTopicPadUrl', function () {

        test('Success', async function () {
            const topicId = uuid.v4();

            const padUrl = cosEtherpad.getTopicPadUrl(topicId);

            assert.equal(padUrl, 'https://' + config.services.etherpad.host + ':' + config.services.etherpad.port + '/p/:topicId'.replace(':topicId', topicId));
        });

    });


    suite('getTopicTitleFromPadContent', function () {

        test('Success - single short line', async function () {
            const str = '<!DOCTYPE HTML><html><body>Topic content here...<br></body></html>';
            const expected = 'Topic content here...';

            assert.equal(cosEtherpad.getTopicTitleFromPadContent(str), expected);
        });

        test('Success - unicode whitespace', async function () {
            const str = '<!DOCTYPE HTML><html><body>Topic​\u00A0content​\u00A0here...<br></body></html>';
            const expected = 'Topic content here...';

            assert.equal(cosEtherpad.getTopicTitleFromPadContent(str), expected);
        });

        test('Success - single line without tags, which is longer than allowed title - substring and add ... as last 3 characters', async function () {
            const str = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at nibh luctus, accumsan magna at, maximus nulla. Maecenas maximus arcu augue, eu tempor massa egestas in. Cras pharetra dolor ac bibendum sodales. Pellentesque eget lectus justo. In malesuada lacus ut finibus mollis. In id metus ut mi facilisis faucibus. Curabitur id augue viverra, pharetra nunc in, tincidunt ipsum. Quisque euismod, sem sed dictum lacinia, est turpis scelerisque velit, eu interdum enim nunc et lacus. Praesent mattis viverra massa, ut interdum ante fermentum ut. Praesent accumsan odio ligula, nec bibendum arcu vestibulum aliquet. Mauris magna augue, laoreet cursus elit sit amet, egestas auctor metus. Nam ut vehicula neque, vel molestie tellus. Proin aliquam nulla ac libero semper, eu semper libero maximus. Maecenas at metus posuere, vestibulum urna non, congue ligula. Nam ut augue tellus. Ut sed facilisis neque. Donec vulputate vestibulum porttitor. Integer venenatis mi sed tellus ornare, non mattis mauris volutpat.';
            const expected = str.substr(0, Topic.TITLE_LENGTH_MAX - 4) + '...';
            assert.equal(cosEtherpad.getTopicTitleFromPadContent(str), expected);
        });

        test('Success - starts with heading tag, take the <h1> tag only', async function () {
            const str = ' <!DOCTYPE HTML><html><body> <h1>TITLE</h1>Your topic here...<br> <h5>sdasdsadsadsss</h5>sssssss<br> <h6>asdasdasdasd</h6> <h6>asdssssssss</h6>as<br> <code>d</code> <code>asss</code>d<br>as<br>ds<br> <code>asd sadasdas dasdasdasd asdasd asdas dasd asd asdsasdas asdasd asdas dasdas dasdas d</code> <code>asdasdasd</code> <code>asdasdasd</code>asd<br>as<br>d<br>asd<br>asdasdasds<br><br>ass<br>d<br>as<br>d<br>as<br>d<br>asd<br>sdasdas<br>asdasdasd<br>asdasdasd<br><br>asd<br><br>asdasd<br>as<br>d<br>as<br>d<br>as<br>das<br>d<br><br></body></html>';
            const expected = 'TITLE';

            assert.equal(cosEtherpad.getTopicTitleFromPadContent(str), expected);
        });

        test('Success - starts with a few empty headings', async function () {
            const str = ' <!DOCTYPE HTML><html><body> <h1></h1> <h1></h1> <h1>Glüfosaadi kasutamine tuleb Eestis keelata</h1><br> <h3>Riigikogu </h3> <h3>Riigikogu maaelukomisjon</h3> <h3>Vabariigi Valitsus</h3> <h3>Maaeluministeerium </h3> <h3></h3> <h3>Allakirjutanud soovivad, et Eesti esindaja Euroopa Komisjonis hääletaks 18. mail mürkkemikaali glüfosaadi kasutusloa pikendamise vastu.</h3><br>18. mail h&#228;&#228;letavad EL liikmesriikide esindajad gl&#252;fosaadi (mida sisaldava tuntuima toote nimi on Roundup, tootja Monsanto) kasutamise &#252;le Euroopas. Maailma Terviseorganisatsiooni (WHO) juures tegutsev Rahvusvaheline V&#228;hiuuringute Agentuur (International Agency for Research on Cancer, IARC) kinnitas 2015. a., et inimesele on gl&#252;fosaat t&#245;en&#228;oliselt kantserogeen ehk v&#228;hkitekitav ning DNAd kahjustav &#252;hend! J&#228;reldused tehti 11 riigi 17 s&#245;ltumatu eksperdi poolt. Nad anal&#252;&#252;sisid p&#245;hjalikult avalikult k&#228;ttesaadavaid teadust&#246;id, mis tehtud USAs, Kanadas ja Rootsis.&nbsp;<br>Mitmed uuringud on n&#228;idanud, et Euroopa riikide kodanike organismid sisaldavad taimem&#252;rgina kasutatava gl&#252;fosaadi j&#228;&#228;ke, kohati on selliseid inimesi &#252;le 90%. Paraku ei tehta selle kohta mingit regulaarset seiret.<br>Eestis on mitmesuguste m&#252;rgij&#228;&#228;kide j&#228;lg toidus pidevalt kasvanud. Riigikontrolli 2015. aasta seire kohaselt on m&#252;rkide j&#228;&#228;ke 51% toiduainetes. Gl&#252;fosaati kasutatakse rohkem kui 750 tootes nii tavap&#245;llumajanduses, metsanduses kui ka koduaedades, teede&#228;&#228;rte hooldamisel, avalikes parkides, isegi laste m&#228;nguv&#228;ljakutel. Iga inimene v&#245;ib sellega ka enda teadmata kokku puutuda. Eestis kasutatakse aastas ligi 290 tonni gl&#252;fosaati.<br>Lisaks v&#228;hiohu tekitamisele inimesel h&#228;vitab gl&#252;fosaat vee- ja mullaelustikku.<br><br> <h3>Eesti saaks olla mahetootmise eeskujuriigiks ja jätkusuutliku riigi mudeliks Euroopas.</h3>Biotaimekaitsevahendite asjatundja dr Roma L Gwynni s&#245;nul kasvab biopestitsiidide turg&nbsp; &#252;le 15% aastas, mis on suurem kui keemiliste&nbsp; taimekaitsevahendite aastane kasv ( 3%).&nbsp; Paljud biopestistiid tulevad traditsioonilisest keemiat&#246;&#246;stustest, mis t&#228;hendab, et ka Eestil on hea v&#245;imalus oma&nbsp; biopestitsiidide t&#246;&#246;stuse rajamiseks. Biotaimekaitsevahendid on alternatiiviks s&#252;nteetiliste ja k&#245;ike h&#228;vitavate m&#252;rkide vastu.<br><br>Eestis otsustavad gl&#252;fosaadi kasutusloa pikendamise &#252;le Riigikogu Maaelu komisjon, Maaeluministeerium ja -minister. T&#228;nane Eesti ametnike soov on gl&#252;fosaadi kasutamine v&#245;imalikult pikaks ajaks ja piiranguteta heaks kiita.&nbsp;&nbsp;<br>Prantsusmaa keskkonnaminister S&#233;gol&#232;ne Royal kinnitas aga, et Prantsusmaa h&#228;&#228;letab tulevaste p&#245;lvede nimel 18. mail v&#228;hkitekitava gl&#252;fosaadi vastu. Samuti on gl&#252;fosaadi kasutamise vastase meelsusega Rootsi, Holland, Itaalia ning enamus Euroopa Liidu riikide kodanikest.<br>Ka Eesti peab oma territooriumil gl&#252;fosaadi kasutamise keelustama!&nbsp;<br><br>Algselt taheti selle taimem&#252;rgi piiranguteta kasutust kogu Euroopa Liidus pikendada 15 aastaks. Euroopa Parlament tegi aga kompromissettepaneku, et kasutusluba pikendatakse seitsmeks aastaks ja oluliste piirangutega. See on ka kompromisside kompromissi punane joon, mida &#252;letada ei tohi. L&#245;plikeks otsustajateks on aga liikmesriikide valitsuste esindajad.&nbsp;<br><br>Anna oma allkiri n&#245;udmisele, et Eesti h&#228;&#228;letaks v&#228;hkitekitava m&#252;rgi gl&#252;fosaadi kasutusloa pikendamise vastu Eestis ja kogu Euroopas!&nbsp;<br><br>Erakond Eestimaa Rohelised<br>MT&#220; Noored Rohelised<br>Eesti Roheline Liikumine<br></body></html>';

            assert.equal(cosEtherpad.getTopicTitleFromPadContent(str), 'Glüfosaadi kasutamine tuleb Eestis keelata');
        });

    });

});
