const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const { createWorker } = require('tesseract.js');
const worker = createWorker();
let isReady = true;

// called is early as possible
/*
(async ()=> {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    isReady = true;
})();
*/

//middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '/public')));

app.use(express.json());

const PORT = process.env.PORT | 5000;

var Storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, __dirname + "/images")
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname)
    }
});

var upload = multer({
    storage: Storage
}).single('image');

//route
app.get('/', (req, res) => {
    res.render('canvas');
});

app.post('/upload', (req, res) => {
    upload(req, res, err => {
        if (err){
            console.log(err);
            res.send('Something went wrong');
        }
        
        var base64Data = req.body.img.replace(/^data:image\/png;base64,/, "");
        let imageBuffer = Buffer.from(base64Data, "base64");

        const worker = createWorker({
            logger: m => console.log(m)
        });

        (async () => {
            if (isReady) {
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                console.log("Recognizing...");
                const { data: { text } } = await worker.recognize(imageBuffer);
                console.log("Recognized text:", text);
                await worker.terminate();
                res.send(text);
            }
        })();

        /*
        var fileName = __dirname + '/images/' + Date.now()+".png";
        var image = fs.writeFile(fileName, base64Data, 'base64', function(err) {
            if (err) return next(err)
        });
        
        (async (img) => {
            if (isReady) {
                const { data : { text } } = await worker.recognize(img);
                console.log(test);
                res.send(text);
            }
        })(image);
        */
    })
});

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});