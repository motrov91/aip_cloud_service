module.exports = {

    isLoggedIn(req, res, next){
        console.log('Se ejecuta ISLOGEDIN')
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('/signin');
    },

    isNotLoggedIn(req, res, next){
        if(!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/survey');
    }

}