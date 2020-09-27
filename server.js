//-----------------Lib-----------------------------
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const http = require('http');
const {mongoose} = require('./db/db');
const {User,Domains, Portfolio, Userinfo} = require('./model/model');
const hbs = require('hbs');
const extfs = require('extfs');
const lodash = require('lodash');
const validator = require('email-validator');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const rmrf = require('rimraf');
const fileupload = require('express-fileupload');
const servIndex = require('serve-index');
const open = require('open');
const {exec} = require('child_process');
var {ObjectID} =require('mongodb');
const isValidDomain = require('is-valid-domain');
const jimp = require('jimp');
const Path = require('path');

//---------------/Lib------------------------------

//---------------MiddelWare------------------------
var app = express();
var server = http.createServer(app);
hbs.registerPartials(__dirname + '/views/partials/');
hbs.registerHelper('ifEquals', function(arg1, arg2, options){
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
app.set('view engine', 'hbs');
app.use(fileupload());
app.use(session({secret: 'session_var', saveUninitialized: true, resave: true}));
var session_data;
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/static', express.static('static'));
app.use(methodOverride('_method'));
app.get('/site',(req,res)=>{
    res.redirect('/');
});
app.get('/site/:username',(req,res)=>{
    res.redirect('/');
});
app.use('/site/',express.static(__dirname + '/public/'),servIndex('public',{'icons': true}));
//---------------/MiddelWare-----------------------
var oldPath;

//---------------Mail Conf-------------------------
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gs9178449@gmail.com',
        pass: '<?php echo "blacklisted" ?>'
    }
});
//---------------/Mail Conf------------------------

var rand,host,editor;
editor = 'NULL';
//---------------Routes----------------------------

//----------------GET Route------------------------
app.get('/',(req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        res.render('home',{user:session_data.usr});
    }else{
        var q = req.query.register;
        if(q == 'success'){
            res.render('home',{register:'success'});
        }else if(q == 'exists'){
            res.render('home',{register: 'exiest'});
        }else if(q == 'notvalid'){
            res.render('home',{register: 'invalid'});
        }
        else if(req.query.verification){
            res.render('home',{verivication:'failed'});
        }
        else if(req.query.verify){
            res.render('home',{verify:'success'});
        }
        else if(req.query.auth){
            res.render('home',{auth:'failed'});
        }else if(req.query.login=='failed'){
            res.render('home',{login:'failed'});
        }  
        else{
            res.render('home');
        }
        
    }
    
});
app.get('/hosting/static',(req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        console.log('Working');
        res.redirect(`/hosting/static/${session_data.usr.username}`);
    }else{
        res.redirect('/?auth=failed');
    }
});
app.get('/hosting/static/create/:username', (req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            if(req.query.repo=='success'){
                //res.send("hello");
                res.redirect(`/hosting/static/${session_data.usr.username}?addweb=success`);
            }else if(req.query.repo=='failed'){
                res.render('repositories',{user:session_data.usr,code:'repoform'});
            }else{
                res.render('repositories',{user:session_data.usr,code:'repoform'});
            }
            
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/?auth=failed');
    }
});
app.get('/hosting/static/:username',(req, res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
                var dirs = [];
                i=0;
                list = fs.readdirSync(`public/${req.params.username}`);
                list.forEach(file=>{
                    dirs[i]=file;
                    i++;
                });
                var path = 'public/'+req.params.username;
                if(i==0){
                    Domains.find({username:req.params.username}).then((domains)=>{
                       // console.log(domains);
                        res.render('repositories',{dir:dirs,code:'list',user:session_data.usr,path:path, domains: domains});
                    }).catch((err)=>{
                        res.send(err);
                    });
                    
                }else{
                    Domains.find({username:req.params.username}).then((domains)=>{
                       // console.log(domains);
                        res.render('repositories',{domains:domains,dir:dirs,code:'list',user:session_data.usr,path:path});
                    }).catch((err)=>{
                        res.send(err)
                    });
                    
                }
        }else{
            res.redirect('/?auth=failed');
        }
    }else{
        res.redirect('/?auth=failed');
    }
});

app.get('/hosting/static/repo/upload/:username/nxt',(req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            if(req.query.path){
                
                if(req.query.path.includes(session_data.usr.username)){

                    var stats = fs.statSync(req.query.path);
                    if(stats.isFile()){
                        var ext = Path.extname(req.query.path).substr(1);
                        console.log(ext);
                        if(ext=='html' || ext=='css' || ext=='js'){
                            editor = req.query.path;
                            res.redirect(`/hosting/static/codeediter/${req.params.username}`);
                        }else{
                            res.redirect(`/hosting/static/repo/upload/${session_data.usr.username}/nxt?path=${oldPath}&itemtype=file`);
                        }
                    }
                    else if(stats.isDirectory()){
                        
                        oldPath = req.query.path;
                        var dirs = [];
                        i=0;
                        list = fs.readdirSync(req.query.path);
                        list.forEach(file=>{
                            dirs[i]=file;
                            i++;
                        });
                        var path = req.query.path;
                        if(!dirs){
                            res.render('upload',{msg:"Not Found",code:'list',repo:'entered',user:session_data.usr,path:path,dir:dirs,oldPath:oldPath});
                        }else{
                            if(req.query.itemtype){
                                res.render('upload',{code:'list',typemsg:'You can not open jpg/png type file in editor',repo:'entered',user:session_data.usr,path:path,dir:dirs,oldPath:oldPath});
                            }else{
                                res.render('upload',{code:'list',repo:'entered',user:session_data.usr,path:path,dir:dirs,oldPath:oldPath});
                            }
                            
                        }
                    }

                }else{
                    res.redirect('/hosting/static/');
                }
            }else{
                res.redirect('/');
            }
            
        }else{
            res.redirect('/?auth=failed');
        }
    }else{
        res.redirect('/?auth=failed');

    }
});


app.get('/hosting/static/portfolio/list', (req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        Portfolio.find({}).then((portfolio)=>{

            res.render('portfolio', {user: session_data.usr,portfolio:portfolio, code: 'Design List'});
        }).catch((err)=>{
            res.send(err);
        });
    }else{
        res.redirect('/?auth=failed&s=somthing');
    }
});
app.get('/hosting/static/portfolio/preview/:id', (req, res)=>{
    if(ObjectID.isValid(req.params.id)){
        res.redirect(`/static/${req.params.id}.html`);
    }else{
        res.redirect('/?id=invalid');
    }
});
app.get('/hosting/static/portfolio/create/:id', (req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        var id = req.params.id;
        res.render('portfolio', {user: session_data.usr,code: 'User Information',id:id})
    }else{
        res.redirect('/?auth=failed');
    }
});
app.get('/hosting/static/codeediter/:username', (req, res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            if(editor=='NULL'){
                res.redirect(`/hosting/static/repo/upload/${session_data.usr.username}/nxt?path=${oldPath}&itemtype=file`);
            }else{
                console.log(editor);
                fs.readFile(editor, 'utf8', function(err, page){
                    if(err) res.send(err);

                    res.render('codeeditor',{data:page, user:session_data.usr,location:editor});
                });
            }
        }else{
            res.redirect('/?auth=required');
        }
    }else{  
        res.redirect('/?auth=failed');
    }
});
app.get('/logout',(req,res)=>{
    req.session.destroy((err) => {
        if(err){
            return console.log(err);
        }
        res.redirect('/');
    });
});
//----------------/Get Route-----------------------





//-----------------POST Route----------------------
app.post('/login', (req, res)=>{
    var body = lodash.pick(req.body, ['username', 'password']);
    User.findBycrediantials(body.username, body.password).then((user)=>{
        if(user.status==true){
            session_data = req.session;
            session_data.usr = user;
            fs.access(`public/${session_data.usr.username}`,function(err){
                if(err){
                    fs.mkdir(`public/${session_data.usr.username}`, {recursive: true}, (err)=>{
                        res.redirect('/?login=success&area=created');
                    })
                }else{
                    res.redirect('/?login=success');
                }
            });
        }else{
            res.redirect(`/?verification=failed`);
        }
    }).catch((err)=>{
        res.redirect('/?login=failed');
    });
});
app.post('/register', (req,res) => {
    var body = lodash.pick(req.body, ['name', 'username', 'email', 'password']);
    if(validator.validate(body.email)){
        var user = User(body);
        user.save().then((data)=>{
            rand = Math.floor((Math.random()*100)+54);
            host = req.get('host');
            var link = 'http://'+req.get('host')+'/verify?id='+rand+'&u='+data._id;
            var mailOption = {
                to: data.email,
                subject: 'BachelosCode[Account Verification]',
                    html: 'Hello Mr '+data.name+' <br>Please Click on the link to verify your email. <br><a href='+link+'>Click Here to Verify</a>'
            }
            //console.log(mailOption);
            transporter.sendMail(mailOption, function(err, response){
                if(err){
                    User.findByIdAndDelete(data._id).then(()=>{
                        res.redirect('/?email=invalid');
                    }).catch((err)=>{
                        res.redirect('/registeration=unsuccess');
                    });
                }else{
                    fs.mkdir(`public/${body.username}`, {recursive: true}, (err) => {
                        if(err){
                            res.redirect('/?register=success&folder=failed');
                        }else{
                            res.redirect('/?register=success');
                        }
                    });
                }
            });
            
        }).catch((err) => {
            res.redirect('/?register=exists');
        });
    }else{
        res.redirect('/?register=notvalid');
    }
    

});
app.get('/verify',(req,res)=>{
    console.log(req.protocol+"://"+req.get('host'));
    if((req.protocol+"://"+req.get('host'))==("http://"+host)){
        console.log('Domain is matched.');
        if(req.query.id == rand){
            var id = req.query.u;
            User.findOneAndUpdate({_id:id},{
                $set:{
                    status: true
                }
            }).then(()=>{
               res.redirect('/?verify=success');

            }).catch((err)=>{
                console.log(err);
                res.send(err);
            });
        }else{
            res.send('Email Verification failed');
        }

    }
});
app.post('/hosting/static/repo/:username/nxt',(req, res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            var path = req.query.path;
            var body = lodash.pick(req.body, ['folder']);
            var p=`${path}/${body.folder}`;
            p=p.split(" ").join("");
            fs.mkdir(p,{recursive: true}, (err)=>{
                if(err){
                    res.redirect(`/hosting/static/repo/upload/${req.params.username}/nxt?path=${req.query.path}&operation=failed`);
                }else{
                    fs.chmodSync(`${p}`, '777'); 
                    res.redirect(`/hosting/static/repo/upload/${req.params.username}/nxt?path=${req.query.path}&operation=success`);
                }
            });
           
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/?auth=failed');
    }
});
app.post('/hosting/static/repo/:username/files',(req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            var path = req.query.path;
            let file = req.files.folder;
            var name = file.name;
            path = path+"/"+name;
            if(file.mv(path)){
                res.redirect(`/hosting/static/repo/upload/${req.params.username}/nxt?path=${req.query.path}&operation=success`);
            }else{
                res.redirect(`/hosting/static/repo/upload/${req.params.username}/nxt?path=${req.query.path}&operation=failed`);
            }
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/?auth=failed');
    }
});




app.post('/hosting/static/create/:username',(req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            var body = lodash.pick(req.body, ['username', 'domain', 'website']);
            body.website = body.website.split(" ").join("");
            body.domain = body.username+'.'+body.website+'.'+'bachelorscode.tech';
            var d = Domains(body);
            d.save().then((data)=>{
                fs.mkdir(`public/${data.username}/${data.website}`,{recursive: true},(err)=>{
                    if(err) res.send(err);
                    var content = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>${data.username}</title>
                        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css">
                        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
                        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"></script>
                    </head>
                    <body style="background: #BB2CD9;">
                    
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-4">
                    
                                </div>
                                <div class="col-lg-4 text-center">
                                    <div class="mt-5">
                                    <img src="space-shuttle.png" width="100%">
                                    </div>
                                   
                                   </strong> 
                                </div>
                                <div class="col-lg-4"> 
                    
                                </div>
                            </div>
                    
                            <div class="text-center mt-5">
                                <strong><h2 style="color: #ffffff;" >Hey! Mr. ${session_data.usr.name} your setup of new website is ready.</h2>
                                <strong><h2 style="color: #ffffff;" >The install worked Successfully ! Congratulations !!</h2>
                                <strong><h6 style="color: #ffffff;" >You can upload your static design</h6>
                                <strong><h6 style="color: #ffffff;" >Your Domain: ${data.username}.${data.website}.bachelorscode.tech</h6>
                               
                            </div>
                    
                        </div>
                        
                    </body>
                    </html>`;
                    fs.chmod(`public/${data.username}/${data.website}`,'777',(err)=>{
                        if(err) res.send('Folder Permission',err);
                        fs.writeFile(`public/${data.username}/${data.website}/index.html`, content, (err)=>{
                            if(err) throw err;
                            console.log('help00');
                            content = `server{listen 80; listen [::]:80; server_name ${data.username}.${data.website}.bachelorscode.tech www.${data.username}.${data.website}.bachelorscode.tech;  location / {proxy_pass http://127.0.0.1:8000/site/${data.username}/${data.website}/; include /etc/nginx/proxy_params;}}`;
                            fs.writeFile(`/etc/nginx/sites-available/${data.username}.${data.website}.bachelorscode.tech.conf`,content,(err)=>{
                                if(err) throw err;
                                fs.writeFile(`/etc/nginx/sites-enabled/${data.username}.${data.website}.bachelorscode.tech.conf`, content, (err)=>{
                                    if(err) throw err;
                                    fs.copyFileSync('public/space-shuttle.png', `public/${data.username}/${data.website}/space-shuttle.png`);
                                    var mailOption = 
                                    {
                                        from: 'gaurav4149singh@gmail.com',
                                        to: session_data.usr.email,
                                        subject: 'BachelosCode[New Website]',
                                        html: '<h3><strong><b style="text-align:center;">BachelorsCode.tech</b></strong></h3>'+'<p><h5 style="text-align:center">User Information<h5></p>'+'<p>Name:'+session_data.usr.name+'<br>username: '+session_data.usr.username+'<br>Email: '+session_data.usr.email+'<br> New Website Link:- http://'+data.username+'.'+data.website+'.'+'bachelorscode.tech'+'<br> Thanks Useing Our Free static website hosting service.'
                                    }
                                    transporter.sendMail(mailOption, function(err,info) {
                                        if(err){                 
                                            res.redirect(`/hosting/static/create/${req.params.username}?repo=success&n=${body.website}&mail=notsent`);
                                        }else{
                                            res.redirect(`/hosting/static/create/${req.params.username}?repo=success&n=${body.website}`);
                                        }
                                    });
                                });
                            });
                        });
                    });

                });
                //res.send(data);
            }).catch((err)=>{
                res.send(err);
            });
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/?auth=failed');
    }
});
app.post('/hosting/static/domain/:username', (req, res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            var body = lodash.pick(req.body, ['username','domain', 'website']);
            if(body.website=='NULL'){
                res.redirect('/hosting/static/domain/'+req.params.username+'?area=404');
            }else{
                
                if(isValidDomain(body.domain)){
                    var d = Domains(body);
                    d.save().then((d)=>{
                        var content = `server{listen 80; listen [::]:80; server_name ${d.domain} www.${d.domain};  location / {proxy_pass http://127.0.0.1:8000/site/${d.username}/${d.website}/; include /etc/nginx/proxy_params;}}`;
                        fs.writeFile(`/etc/nginx/sites-available/${d.domain}.conf`, content, function (err){
                            if(err) throw err;
                            fs.writeFile(`/etc/nginx/sites-enabled/${d.domain}.conf`, content, function (err){
                                var mailOption = 
                                {
                                    from: 'gs9178449@gmail.com',
                                    to: session_data.usr.email,
                                    subject: 'BachelosCode[New Domain Link]',
                                        html: '<h3><strong><b style="text-align:center;">BachelorsCode.tech</b></strong></h3>'+'<p><h5 style="text-align:center">User Information<h5></p>'+'<p>Name:'+session_data.usr.name+'<br>username: '+session_data.usr.username+'<br>Email: '+session_data.usr.email+'<br> New Domain successfully Linked:- http://'+d.domain+'<br> Thanks Useing Our Free static website hosting service.'
                                }
                                transporter.sendMail(mailOption, function(err,info) {
        
                                    if(err){                 
                                        res.redirect(`/hosting/static/${session_data.usr.username}`);
                                    }else{
                                        res.redirect(`/hosting/static/${session_data.usr.username}`);
                                    }
                                });
                                
                            }); 
                        });
                    }).catch((err)=>{
                        
                        res.redirect(`/hosting/static/${session_data.usr.username}`);
                    });
                }else{
                    res.redirect(`/hosting/static/${session_data.usr.username}?domain=invalid`);
                }
            }
        }else{
            
            res.redirect('/?auth=failed');
        }
    }else{
        
        res.redirect('/?auth=failed');
    }
});
//-----------------/POST Route---------------------
app.delete('/hosting/static/repo/:username/nxt', (req,res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            var body = lodash.pick(req.body, ['old']);
            var path = req.query.path;
            if(!rmrf.sync(path)){
                res.redirect(`/hosting/static/repo/upload/${req.params.username}/nxt?path=${body.old}&operation=success`);
            }else{
                res.redirect(`/hosting/static/repo/upload/${req.params.username}/nxt?path=${path}&operation=failed`);
            }
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/?auth=failed');
    }
});
app.delete('/hosting/static/remove/website/:username',(req, res)=>{
    session_data=req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            var body = lodash.pick(req.body, ['username','website']);
            if(body.website=='NULL'){
                res.redirect(`/hosting/static/${session_data.usr.username}?area=404`);
            }else{
                var dom = body.username+'.'+body.website+'.'+'bachelorscode.tech';
                Domains.find({website: body.website}).then((data)=>{ 
                    for(var i=0; i<data.length; i++){
                        rmrf.sync(`/etc/nginx/sites-available/${data[i].domain}.conf`);
                        rmrf.sync(`/etc/nginx/sites-enabled/${data[i].domain}.conf`);
                        Domains.findByIdAndDelete(data[i]._id).then(()=>{
                            console.log('works');
                        }).catch((err)=>{
                            console.log(err);
                        });
                    }
                    if(!rmrf.sync(`public/${body.username}/${body.website}`)){
                        res.redirect(`/hosting/static/${session_data.usr.username}?dlt=success`);
                    }else{
                        res.send('err');
                    }
                }).catch((err)=>{
                    res.send(err);
                });
            }
        }else{
            res.redirect('/');
        }
        
    }else{
        res.redirect('/?auth = failed');
    }
});
app.post('/hosting/static/portfolio/create/:id', (req, res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(ObjectID.isValid(req.params.id)){
            var body = lodash.pick(req.body, ['name','email','number','dob','status','work','img','about','insta','facebook','linkdin']);
            body.img = 'null';
            var dir = body.name;
            dir = dir.split(" ").join("");
            dir = dir.toLowerCase();
            var info = Userinfo(body);
            info.save().then((data)=>{
                fs.mkdir(`public/${session_data.usr.username}/${dir}`, {recursive: true}, (err)=>{
                    if(err) res.send(err);
                    fs.chmod(`public/${session_data.usr.username}/${dir}`, '777', (err)=>{
                        if(err) res.send(err);
                        var img = req.files.img;
                        var path = `public/${session_data.usr.username}/${dir}/${dir}.jpg`;
                        // jimp.read(img, (err, image)=>{
                        //     if(err) res.send('Image err');
                        //     image.resize(250, 250).quality(60).greyscale().write(path);
                            img.mv(path);
                            var list = fs.readdirSync(`static/${req.params.id}`);
                            list.forEach(file=>{
                                
                               
                                console.log(file);
                                fs.createReadStream(`static/${req.params.id}/${file}`).pipe(fs.createWriteStream(`public/${session_data.usr.username}/${dir}/${file}`));
                                    // fs.copyFile(file, `public/${session_data.usr.username}/${dir}/${file}`, (err)=>{
                                    //     if(err){
                                    //         console.log(err);
                                    //     }
                                    // });
                               
                            });
                            fs.readFile(`static/${req.params.id}/${req.params.id}.html`, 'utf8', function(err, page){
                                if(err) res.send(err);
                                var name = 'USER_NAME';
                                var dob = 'USER_DOB';
                                var email = 'USER_EMAIL';
                                var number = 'USER_NUMBER';
                                var status = 'USER_MARITAL_STATUS';
                                var work =   'USER_WORK';
                                var about =  'USER_ABOUT';
                                var img = 'USER_IMAGE';
                                var title = 'USER_TITLE';
                                var insta = 'USER_INSTA';
                                var facebook = 'USER_FACEBOOK';
                                var linkdin = 'USER_LINKDIN';
                                page = page.replace(new RegExp(name), data.name);
                                page = page.replace( new RegExp(dob), data.dob);
                                page = page.replace(new RegExp(email), data.email);
                                page = page.replace(new RegExp(number), data.number);
                                page = page.replace(new RegExp(status), data.status);
                                page = page.replace(new RegExp(work), data.work);
                                page = page.replace(new RegExp(about), data.about);
                                page = page.replace(new RegExp(img), dir+'.jpg');
                                page = page.replace(new RegExp(title), data.name);
                                page = page.replace(new RegExp(insta), data.insta);
                                page = page.replace(new RegExp(facebook), data.facebook);
                                page = page.replace(new RegExp(linkdin), data.linkdin);
                                fs.writeFile(`public/${session_data.usr.username}/${dir}/index.html`, page , (err)=>{
                                    if(err) res.send('page write error');
                                    content = `server{listen 80; listen [::]:80; server_name ${session_data.usr.username}.${dir}.bachelorscode.tech www.${session_data.usr.username}.${dir}.bachelorscode.tech;  location / {proxy_pass http://127.0.0.1:8000/site/${session_data.usr.username}/${dir}/; include /etc/nginx/proxy_params;}}`;
                                    fs.writeFile(`/etc/nginx/sites-available/${session_data.usr.username}.${dir}.bachelorscode.tech.conf`, content, function (err){
                                        if(err) throw err;
                                        fs.writeFile(`/etc/nginx/sites-enabled/${session_data.usr.username}.${dir}.bachelorscode.tech.conf`, content, function (err){
                                            Domains.insertMany({
                                                username: session_data.usr.username,
                                                domain: session_data.usr.username+'.'+dir+'.bachelorscode.tech',
                                                website: dir
                                            }).then((data)=>{
                                                var mailOption = 
                                                {
                                                    from: 'gaurav4149singh@gmail.com',
                                                    to: session_data.usr.email,
                                                    subject: 'BachelosCode[New Portfolio]',
                                                        html: '<h3><strong><b style="text-align:center;">BachelorsCode.tech</b></strong></h3>'+'<p><h5 style="text-align:center">User Information<h5></p>'+'<p>Name:'+session_data.usr.name+'<br>username: '+session_data.usr.username+'<br>Email: '+session_data.usr.email+'<br> New Domain successfully Linked:- http://'+session_data.usr.username+'.'+dir+'.'+'bachelorscode.tech <br> Thanks Useing Our Free static website hosting service.'
                                                }
                                                transporter.sendMail(mailOption, function(err,info) {
                        
                                                    if(err){                 
                                                        res.redirect(`/hosting/static/${session_data.usr.username}?portfolio=ok`);
                                                    }else{
                                                        res.redirect(`/hosting/static/${session_data.usr.username}`);
                                                    }
                                                });
                                            });
                                            
                                        }); 
                                    });
                                    
                                });
                                
                            });
                        // });
                        
                    });
                });
            }).catch((err)=>{
                res.send(err);
            });
        }else{
            res.redirect('/');
        }
    }
    else{
        res.redirect('/?auth=failed');
    }
});
app.post('/api/mailsys/profile/:id',(req, res)=>{
    if(ObjectID.isValid(req.params.id)){
        var email = req.body.email;
        var subject = req.body.subject;
        var msg = req.body.msg;
        var num = req.body.num;
        if(ObjectID.isValid(req.params.id)){
            User.findById(req.params.id).then((usr)=>{
                var mailOption = {
                    from: 'gs9178449@gmail.com',
                    to: usr.email,
                    subject: subject,
                    html: num+"<br> Contact Number :- "+num,
                }
                transporter.sendMail(mailOption, (err, info)=>{
                    if(err){
                        res.status(400).send({
                            msg: "Email not sent"
                        });
                    }else{
                        res.status(201).send({
                            msg :"ok"
                        });
                    }
                })
            }).catch((err)=>{
                console.log(err);
                res.send(err);
            }); 
        }else{
            res.status(400).send({
                msg:'Bad Getway',
            });
        }
        
    }else{
        res.status(404).send({
            message: "Data Not Found"
        });
    }
});

app.post('/hosting/static/codeediter/:username', (req, res)=>{
    session_data = req.session;
    if(session_data.usr){
        if(session_data.usr.username==req.params.username){
            var body = req.body;
            
            fs.writeFile(body.location, body.data, (err)=>{
                if(err) res.redirect('/servererror');
                editor = body.location;
                res.redirect(`/hosting/static/codeediter/${req.params.username}?edit=success`);
            });
        }else{
            res.redirect('/hosting/static/');
        }
        
    }else{
        res.redirect('/?auth=failed');
    }
    
})
//---------------/Routes---------------------------






//-----------------Routes for Dynamic--------------
app.get('/hosting/dynamic',(req,res)=>{
    session_data = req.session;
    if(session_data.usr){

    }else{
        res.redirect('/?auth=failed');
    }
});
//-----------------/Routes for dynamic-------------


app.use(function(req, res){
    session_data  = req.session;
    if(session_data.usr){
        res.status(404)
    res.render('404',{user: session_data.usr.username});
    }else{
        res.status(404)
    res.render('404');
    }
    
});
//---------------Server----------------------------
server.listen(8000,(err)=>{
    if(err){
        console.log(err);
    }
    console.log('Server is started');
});
//--------------/Server----------------------------
