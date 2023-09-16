require("dotenv").config();
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose");
const session = require('express-session')
const path = require('path')
const multer = require('multer');
const { image } = require("qr-image");
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, "public/Images");
    },
    filename: (req,file, cb) =>{
        if(file.originalname != ""){
            console.log(file);
            console.log("hi");
        }
        
        cb(null, Date.now() +  path.basename(file.originalname))
    }
})

const upload = multer({storage: storage})

//require('./auth')

const app = express();
// trust first proxy




app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: true }
  }))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://127.0.0.1:27017/studentDB')

const subjectSchema = new mongoose.Schema({
    name: String,
    credits: Number,
    misses: Number,
    attendance: Number,
})

const studentSchema = new mongoose.Schema({
    name: String,
    age: String,
    subjects:[subjectSchema],
    googleId: String,
    image: String
})

studentSchema.plugin(passportLocalMongoose);

const Student = mongoose.model("Student",studentSchema)
const Subject = mongoose.model("Subject",subjectSchema)




passport.use(Student.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

app.get('/register',(req,res)=>{
    res.render('register.ejs')
})

app.post('/register',(req,res)=>{
    // const student = new Student({
    //     name: req.body.name
    // })
    // student.save();
    Student.register({username: req.body.username}, req.body.password).then((user)=>{
        
        
        
        
        passport.authenticate("local")(req,res,()=>{
            
            res.redirect("/profile/" + req.body.username + "/" + req.body.name + "/" + req.body.age)
        })
    })
})

app.post('/login',(req,res)=>{
    const user = new Student ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user,()=>{
        passport.authenticate("local")(req,res,()=>{
            Student.findOne({username: req.body.username}).then((student)=>{
                console.log(student.name);
                res.redirect("/profile/" + req.body.username + "/" + student.name + "/" + student.age)
            })
            
        })
    })
})


app.post("/upload",upload.single("image"), (req,res)=>{
    const image = req.file;
    //const check = image + "hello"
    console.log(image);
    const user = req.body.inp
    //if(check === "hello"){
    Student.updateOne({username: user},{image: image.filename}).then()
    //}
    Subject.find().then((subs)=>{
        Student.findOne({username: user}).then((person)=>{

        
        res.render("home.ejs",{
            subs: person.subjects,
            image: person.image,
             user: user,
             profile: person
             //name: name
        })
    })
    })
})




app.get("/login",(req,res)=>{

    

    res.render("login.ejs")
})



app.get("/",(req,res)=>{


    if (req.isAuthenticated())
    {
        Subject.find().then((subs)=>{

            res.render("home.ejs",{
                subs: subs,
            })
        })
    } else{
        res.redirect("/login");
    }    
})

app.get("/profile/:mail/:name/:age",(req,res)=>{

    res.locals.name = req.body.name

    if (req.isAuthenticated())
    {
        const user = req.params.mail;
        const name = req.params.name;
        const age = req.params.age;
        console.log(user);
        console.log(name);
        Student.updateOne({username: user},{name: name,age: age}).then((stud)=>{
        });
        //const doc = student.updateOne({name: name})
        // Student.updateOne({username: user},{subjects: }).then((stud)=>{

        // })
        Subject.find().then((subs)=>{
            Student.findOne({username: user}).then((profile)=>{
                console.log("name is "+ profile.image);
                res.render("home.ejs",{
                    subs: profile.subjects,
                    // user: user,
                    // name: name,
                    profile: profile,
                    
                })
            })
            
        })
    } else{
        res.redirect("/login");
    }    
})



app.post("/newsubject/:user",(req,res)=>{
    const newSubject = req.body.newSubject;
    const newMisses = req.body.newMisses;
    const user = req.params.user;
    const subject = new Subject ({
        name: newSubject,
        misses: newMisses,
        attendance: 0
    })
    Student.findOne({username: user}).then((person)=>{
        person.subjects.push(subject);
        person.save();
        res.redirect("/profile/"+person.username +"/"+person.name+"/"+person.age);
    })
    //subject.save();
    
})

app.post("/add/:user",(req,res)=>{
    const subject = req.body.addButton;
    const user = req.params.user;
    Student.findOne({username: user}).then((sub)=>{
        for(var i = 0; i<sub.subjects.length;i++){
            if(sub.subjects[i].name === subject){
                console.log("Yes");
                if(sub.subjects[i].attendance <= 8){
                    
                    console.log("yes");
                    Student.updateOne({"username": user},{$inc: {"subjects.$[subj].attendance":1}},{"arrayFilters":[{"subj.name": sub.subjects[i].name}]}).then();
                    
                }
                
            }
        }
        res.redirect("/profile/" + sub.username + "/" + sub.name + "/" + sub.age)
    })
    
    
})

app.post("/picture/:username",(req,res)=>{
    user = req.params.username;
    Student.findOne({username: user}).then((profile)=>{
        res.render("picture.ejs",{
            profile: profile
        })
    })
    
})

app.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.listen(3000, ()=>{
    console.log("listening");
})
