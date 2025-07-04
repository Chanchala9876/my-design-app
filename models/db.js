const mongoose=require('mongoose')
async function connectToMongoDB(url)
{
    return mongoose.connect(url);
}
module.exports={
    connectToMongoDB,
}
mongoose.set("strictQuery",true);