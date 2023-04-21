const express = require('express')
const app = express()
const cors = require("cors");
const MongoDB = require("mongoose");
const cookieParser = require('cookie-parser')
const GetRouter = require("./src/router/GetRouter")
const PostRouter = require("./src/router/PostRouter")
const UpdateRouter = require("./src/router/UpdateRouter")
const DeleteRouter = require("./src/router/DeleteRouter")
const {Globals} = require("./src/helper/Globals");

app.use(cookieParser());
app.use(express.json());
app.use(cors({origin: true, credentials: true}));

app.use('/api/get/', GetRouter);
app.use('/api/post/', PostRouter);
app.use('/api/update/', UpdateRouter);
app.use('/api/delete/',DeleteRouter);

MongoDB.connect(Globals.dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) return console.log("Mongo DB Not Connected ! SomeThing Went Wrong");
    else return console.log("Mongo Db Connected Successfully");
})

app.listen(process.env.PORT || Globals.port, () => {
    console.log(`App listening at http://localhost:${Globals.port}`)
})