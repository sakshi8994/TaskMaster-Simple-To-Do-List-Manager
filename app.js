const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-sakshi:Test123@cluster0.4gjocpo.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = {
    name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<--Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name:String,
  items:[itemSchema]
}
const List = mongoose.model("List",listSchema);
app.get("/", async (req, res) => {
    try {
        const foundItems = await Item.find({});
        if (foundItems.length === 0) {
            await Item.insertMany(defaultItems);
            console.log("Successfully data is inserted");
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/:customListName", async (req, res) => {
  const customListName =_.capitalize( req.params.customListName);

  try {
      const foundList = await List.findOne({ name: customListName });

      if (!foundList) {
          console.log("Doesn't exist");
          const list = new List({
              name: customListName,
              items: defaultItems
          });
          await list.save();
          res.redirect("/"+customListName);
      } else {
          console.log("Exists");
          res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }

      // Add your rendering or redirect logic here
      
  } catch (err) {
      console.error("Error:", err);
      res.status(500).send("Internal Server Error");
  }
});


app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
      name: itemName
  });

  try {
      if (listName === "Today") {
          await newItem.save();
          res.redirect("/");
      } else {
          const foundList = await List.findOne({ name: listName });

          if (foundList) {
              foundList.items.push(newItem); // Push the new item into the items array
              await foundList.save();
              res.redirect("/" + listName);
          } else {
              console.log("List not found");
              res.status(404).send("List not found");
          }
      }
  } catch (err) {
      console.error("Error:", err);
      res.status(500).send("Internal Server Error");
  }
});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
      try {
          await Item.findByIdAndRemove(checkedItemId);
          console.log("Successfully deleted");
          res.redirect("/");
      } catch (err) {
          console.error("Error:", err);
          res.status(500).send("Internal Server Error");
      }
  } else {
      try {
          await List.findOneAndUpdate(
              { name: listName },
              { $pull: { items: { _id: checkedItemId } } }
          );
          console.log("Successfully deleted");
          res.redirect("/" + listName);
      } catch (err) {
          console.error("Error:", err);
          res.status(500).send("Internal Server Error");
      }
  }
});



app.listen(3000, function () {
    console.log("Server is started on port 3000");
});
