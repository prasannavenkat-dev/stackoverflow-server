const mongoose =  require('mongoose');

class Database{

    connect(){
        try {
            mongoose.connect(process.env.DB_URL,{autoIndex:true});
            
        } catch (error) {
            console.log(error,"jlhj");
            throw error;
        }
    }
}


module.exports = new Database();