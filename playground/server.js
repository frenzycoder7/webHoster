const express = require('express');
const http = require('http');
const {exec} = require('child_process');
const fs = require('fs');
var app = express();
var server = http.createServer(app);
app.get('/',(req,res)=>{
    const waterImage = 'https://i.imgur.com/unZ7L7F.png'

exports.run = (client, message, args, mentionAuthor) => {
    Jimp.read(mentionAuthor.avatarURL).then(av => {
        Jimp.read(waterImage).then(water => {
            Jimp.loadFont(Jimp.FONT_SANS_128_BLACK, (err, font) => {
                if (err) throw err
                av.resize(70, 70)
                    .rotate(-18)
                water.resize(624, 351)
                    .quality(72)
                    .print(font, 100, 100, `Drink Water!`)
                    .composite(water, 624, 351)
                    .composite(av, 250, 120)
                    .write('./water.png')
                    .getBuffer(Jimp.MIME_PNG, (err, img) => {
                        if (err) throw err
                        message.channel.send(`Drink water, ${mentionAuthor}!`, {files: [img]})
                    })
            }).catch(e => {
                throw e
            })
        }).catch(e => {
            throw e
        })
    })
};
});
server.listen(3000);