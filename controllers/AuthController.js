const passport = require('../middlewares/passport');
const User = require('../models/User');
const storage = require('../config/multer');
const { sendMail } = require("./mailAPI")

//[GET] /
const getHomePage = (req, res, next) => {
  res.render('home/home');
};

//[GET] /signin
const getSignIn = (req, res, next) => {
  //var messages = req.flash('error');
  // res.status(302).render('auth/signin', {
  //   //messages: messages,
  //   //hasErrors: messages.length > 0,
  // });
  res.render("auth/signin");
};

//[POST] /signin
const postSignIn = (req, res, next) => {
  // passport.authenticate('local', {
  //   successRedirect: '/user/home',
  //   failureRedirect: '/signin',
  //   failureFlash: true,
  // })(req, res, next);// Thêm dòng này để gọi hàm authenticate
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Authentication failed, redirect to the sign-in page
      return res.status(400).json({ error: 'Đăng nhập thất bại' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Check user role and set the successRedirect accordingly
      const successRedirect = (user.role === 'tutor') ? '/tutor/' : '/user/';
      //return res.redirect(successRedirect);
      return res.status(200).json({ success: true, redirectUrl: successRedirect, msg: "Đăng nhập thành công!" });
    });
  })(req, res, next);
};

//[GET] /signup
const getSignUp = (req, res, next) => {
  // //var messages = req.flash('error');
  // res.render('auth/signup', {
  //   //messages: messages,
  //   //hasErrors: messages.length > 0,
  // });
  res.render("auth/signup");
};

// [POST] /signup
const postSignUp = (req, res, next) => {
 
  if(req.body.password != req.body.passwordConfirmation) {
    return res.status(400).json({ error: 'Confirm Password is not match with Password!' });
  }
  User.findOne({ 'username': req.body.username })
  .then( (user) => {
    if (user) {
      return res.status(400).json({ error: 'Username is already in use.' });
    }
    else {
      var newUser = new User();
      newUser.username = req.body.username;
      newUser.email = req.body.email;
      newUser.password = newUser.encryptPassword(req.body.password);

      // Nếu có ảnh đại diện được tải lên
      if (req.file) {
        // Gán id của ảnh đại diện cho user
        console.log(req.file.filename);
        newUser.avatar = req.file.filename;
      }
      newUser.save()
      .then(() => {
        res.status(200).json({ success: true, redirectUrl: '/signin' });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
    }
    
  })
  .catch(next);
};

//[GET] /forget-password
const getForgetPassword = (req, res, next) => {
  var messages = req.flash('error');
  res.render('auth/forgetPassword', {
    messages: messages,
    hasErrors: messages.length > 0,
  });
};

//[POST] /forget-password
const postForgetPassword = async(req, res, next) => {
  try {
    const { email } = req.body;
    console.log(email);
   

    const user = await User.findOne({ email: email });
    if (!user) {
        res.status(404).json({ error: "Email này không tồn tại" });
    }
    else {
        //const secret = process.env.JWT_SECRET + user.password;
        //const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: "30m" });
        const reserPasswordLink = `http://localhost:10000/reset-password?id=${user._id}`;

        const mailOption = {
            //from: `Admin Le Nguyen Thai <lnthai21@clc.fitus.edu.vn>`,
            to: email,
            subject: "Reset Password",
            text: ``,
            html: `<h3>Dear ${user.username} </h3>, <br>
            <p>We will give user the reset link below:<br>
            ${reserPasswordLink}<br>
            access to this link reset your password.<br>
            Regrad</p>`
        }
      
        sendMail(mailOption).then(result => { console.log(result) }).catch(e => { console.log(e) });
        res.send("Please check your email to reset password .....");
    }

  } catch (error) {
    next(error)
  }
};

//[GET] /reset-password
const getResetPassword = async(req, res, next) => {
  try {
    const { id } = req.query;

    const user = await User.findById(id);

    if (!user) {
        res.status(404).json({ error: "Not found" });
    }
    else {

        // const secret = process.env.JWT_SECRET + user.password;
        // const payload = jwt.verify(token, secret);

        // if (payload.id !== id) {
        //     res.status(401).json({ msg: "Invalid token or id" });
        // }

        // Successfull because error will throw 
        res.render("auth/resetPassword", { id: user._id })
    }
  } catch (error) {
    next(error);
  }
};

//[POST] /reset-password
const postResetPassword = async(req, res, next) => {
  try {
    const { password, password2 } = req.body;

    if (password !== password2) {
        res.status(400).json({ error: "New password and confirmation do not match" });
    }

    const { id} = req.query;

    const user = await User.findById(id);

    if (!user) {
        res.status(404).json({ error: "Not found user or id invalid!" });
    }
    else {
        // const secret = process.env.JWT_SECRET + user.password;
        // const payload = jwt.verify(token, secret);

        // if (payload.id !== user.id) {
        //     res.status(401).json({ message: "Id invalid or token invalid" });
        // }

        user.password = user.encryptPassword(password);
        await user.save();

        res.status(200).send("Change password successfully!");
    }

  } catch (error) {
    next(error);
  } 
};

const Logout = async (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
};

module.exports = {
  getHomePage,
  getSignIn,
  postSignIn,
  getSignUp, 
  postSignUp,
  getForgetPassword,
  postForgetPassword,
  getResetPassword,
  postResetPassword,
  Logout,
}

