import dbConnection from './db_connection/index.js';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import { server_config } from "./config/index.js";
import LocationSeeder from "./seeders/LocationSeeder.js";
import CustomerSeeder from "./seeders/CustomerSeeder.js";
import CustomerLogSeeder from "./seeders/CustomerLogSeeder.js";
import opiniionTest from "./validators/opiniionTest.js";
import CustomerLog from "./models/CustomerLog.js";
import mongoose from 'mongoose';
mongoose.set('strictQuery', false)

dbConnection().then(() => {
    console.log('db connected');
    LocationSeeder().then(() => {
        CustomerSeeder().then(() => {
            CustomerLogSeeder();
        })
    })
});
const app = express();
app.use(cors());
app.use(bodyParser.json());


app.post('/opiniionTest',async (req, res) => {
    try {
        const {locationId, startDate, endDate} = req.body;
        const data = await opiniionTest.validateAsync({ locationId, startDate, endDate });
        const customerLogs = await CustomerLog.aggregate([
            {
               $lookup:
                  {
                    from: "customers",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customers"
                  }
            },
            {
                $match: { "date": {$gte:data.startDate,$lt:data.endDate}}
             },
            {
               $match: { "customers.location": mongoose.Types.ObjectId(locationId)}
            }, 
          {$unwind: "$customers"},
                {$group: {
                     _id: locationId,
                      custumer:{$push:  "$$ROOT"},
                }}
         ])
         res.json(customerLogs)
    }catch (e) {
        res.send(e.message).status(400);
    }

})

app.listen(server_config.PORT, () => {
    console.log(`Example app listening on port ${server_config.PORT}`)
})