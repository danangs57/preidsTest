var express = require('express');
var router = express.Router();
const stock_read_log = require('../models/stock_read_log');
const FileSystem = require("fs");

router.use('/export-data', async (req, res) => {
  const list = await stock_read_log.aggregate([
    {
      $match: {}
    }
  ]).exec();
  
  FileSystem.writeFile('./stock_read_log.json', JSON.stringify(list), (error) => {
      if (error) throw error;
  });

  console.log('stock_read_log.json exported!');
  res.json({statusCode: 1, message: 'stock_read_log.json exported!'})
});

router.use('/import-data', async (req, res) => {
  const list = await stock_read_log.aggregate([
    {
      $match: {}
    }
  ]).exec();
  
  FileSystem.readFile('./stock_read_log.json', async (error, data) => {
      if (error) throw error;

      const list = JSON.parse(data);

      const deletedAll = await stock_read_log.deleteMany({});

      const insertedAll = await stock_read_log.insertMany(list);

      console.log('stock_read_log.json imported!');
  res.json({statusCode: 1, message: 'stock_read_log.json imported!'})
  });

  
})

router.use('/edit-repacking-data', async (req, res) => {
  
  // these may not the best approach since im new to mongo but bare with me its only times matter

  // reject qr_list process
  for(var index in req.body.reject_qr_list)
  {
      const edit_qr = await stock_read_log.updateOne(
    {
      payload: req.body.payload,
      company_id:req.body.company_id
    },
    { 
      $set:{
        status_repacking: 1 //repacked
      },
      "$pull": {
        "qr_list": {
          payload: req.body.reject_qr_list[index].payload
        }
      },
      $inc: { qty: -1 }
    }
    );
  }
  // new qr_list process
  for(var indexx in req.body.new_qr_list){
    const pulling_qr = await stock_read_log.updateOne(
    {
      payload: {$ne:req.body.payload},
      "qr_list.payload": req.body.new_qr_list[indexx].payload,
      company_id:req.body.company_id
    },
    {
      $pull: {
            "qr_list": {
              payload: req.body.new_qr_list[indexx].payload
            }
          },
       $inc: { qty: -1 }
    }
    );
 
    const payload = await stock_read_log.findOne({
      "payload" :req.body.new_qr_list[indexx].payload,
    })

    const push_qr = await stock_read_log.updateOne(
      {
        payload: req.body.payload,
        company:req.body.company_id
      },
      { 
        $set:{
          status_repacking: 1, //repacked
        },
        "$addToSet": {
          "qr_list": payload
        },
        $inc: { qty: 1 }
      }
   );

  
}
    

  res.json({statusCode: 1, message: 'stock_read_log.edit repacking data successfuly !'})

})






router.use('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
