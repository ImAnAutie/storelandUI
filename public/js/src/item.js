import { makeStorelandRequest } from "./storelandCORE.js";

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const loadItemList = async function () {
  console.log("About to load the item list page, initing alpine data model");
  Alpine.store("selectedPage", "item");
  try {
    const itemRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/item`,
      "GET"
    );
    console.table(itemRes);
    if (itemRes.status) {
      Alpine.store("pageItemList", itemRes.item);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        itemRes.message,
        "Cancel",
        "Try again",
        "green",
        false,
        function () {
          location.reload();
        }
      );
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching item data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading item information. Please try again",
      "Cancel",
      "Try again",
      "green",
      false,
      function () {
        location.reload();
      }
    );
    return;
  }
};

const loadItemEdit = async function (params) {
  console.log("About to load the item edit page, initing alpine data model");
  Alpine.store("selectedPage", "item");
  console.log(params);

  try {
    const itemRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/item/${params.itemId}`,
      "GET"
    );
    console.table(itemRes);
    if (itemRes.status) {
      const item = itemRes.item;
      Object.assign(item, {
        fieldValidations: {
          name: true,
        },
        validateField: function (fieldName) {
          const pageItemEdit = Alpine.store("pageItemEdit");
          switch (fieldName) {
            case "name":
              pageItemEdit.fieldValidations.name = iodine.isValid(
                pageItemEdit.name,
                ["required"]
              );
              break;
          }
        },
        formSubmitError: function (title, message) {
          Alpine.store("appAlert").show(
            title,
            message,
            "Cancel",
            "Ok",
            "gray",
            false,
            function () {
              Alpine.store("appAlert").hide();
            }
          );
        },
        formSubmit: async function () {
          console.log("Validating item data");
          const pageItemEdit = Alpine.store("pageItemEdit");
          if (!iodine.isValid(pageItemEdit.name, ["required"])) {
            return pageItemEdit.formSubmitError(
              "Item name required",
              "Please enter a item name"
            );
          }

          const editItemData = {
            name: pageItemEdit.name,
          };
          console.log("Submtting item edit");
          console.table(editItemData);
          Alpine.store("loading", true);
          try {
            const editItemRes = await makeStorelandRequest(
              `company/${Alpine.store("appCompany")._id}/item/${
                pageItemEdit._id
              }`,
              "PATCH",
              editItemData
            );
            console.table(editItemRes);
            if (editItemRes.status) {
              console.log("Successfully edited item");
              //@todo some sort of toast?
              const item = editItemRes.item;
              router.navigate(
                router.generate("item", {
                  itemId: item._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                editItemRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageItemEdit").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            //@TOOO report this
            console.log("Error editing item");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured when editing this item",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pageItemEdit").formSubmit();
              }
            );
          }
        },
      });

      item.deleteConfirm = {
        visible: false,
        name: "",
        confirm: async function () {
          const pageItemEdit = Alpine.store("pageItemEdit");
          if (
            Alpine.store("pageItemEdit").deleteConfirm.name ==
            Alpine.store("pageItemEdit").name
          ) {
            console.log("Deleting item now it's confirmed");
            Alpine.store("pageItemEdit").deleteConfirm.visible = false;
            Alpine.store("loading", true);
            try {
              const deleteItemRes = await makeStorelandRequest(
                `company/${Alpine.store("appCompany")._id}/item/${
                  pageItemEdit._id
                }`,
                "DELETE"
              );
              console.table(deleteItemRes);
              if (deleteItemRes.status) {
                console.log("Successfully deleted item");
                router.navigate(router.generate("item.list"));
              } else {
                console.log("API returned false status");
                Alpine.store("loading", false);
                Alpine.store("appAlert").show(
                  "Something went wrong",
                  deleteItemRes.message,
                  "Cancel",
                  "Try again",
                  "green",
                  true,
                  function () {
                    Alpine.store("appAlert").visible = false;
                    Alpine.store("pageItemEdit").deleteConfirm.confirm();
                  }
                );
                return;
              }
            } catch (error) {
              //@TOOO report this
              console.log("Error deleting item");
              console.log(error);
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                "A network error occured when deleting this item",
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageItemEdit").deleteConfirm.confirm();
                }
              );
            }
          }
        },
      };
      item.delete = function () {
        //@todo actually delete packages containing this item
        Alpine.store("appAlert").show(
          "Are you sure?",
          "Deleting this item will delete all item sets and packages containing this item. This CANNOT be undone.",
          "Cancel",
          "Yes, delete this item",
          "red",
          true,
          function () {
            Alpine.store("appAlert").hide();
            Alpine.store("pageItemEdit").deleteConfirm.name = "";
            Alpine.store("pageItemEdit").deleteConfirm.visible = true;
          }
        );
      };
      Alpine.store("pageItemEdit", item);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading item information. Please try again",
        "Cancel",
        "Try again",
        "green",
        false,
        function () {
          location.reload();
        }
      );
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching item data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading item information. Please try again",
      "Cancel",
      "Try again",
      "green",
      false,
      function () {
        location.reload();
      }
    );
    return;
  }
};

const loadItemNew = async function () {
  console.log("About to load the new item page, initing alpine data model");
  Alpine.store("selectedPage", "item");

  Alpine.store("pageItemNew", {
    name: "",
    type: "",
    weight: 0,
    itemList: [],
    itemSet: [],
    itemSetAddItem: "",
    itemSetIncrement: function (itemId, incrementAmount) {
      console.log(itemId, incrementAmount);
      //Fix for a weird bug where removing the first item
      //set the following one to qty 0
      const itemSet = JSON.parse(
        JSON.stringify(Alpine.store("pageItemNew").itemSet)
      );
      const itemIndex = itemSet.findIndex((item) => item.id == itemId);
      console.log(itemIndex);
      const item = itemSet[itemIndex];
      console.table(item);
      item.qty = item.qty + incrementAmount;
      console.table(item);
      if (item.qty <= 0) {
        console.log("Item qty zero or less, removing from set");
        itemSet.splice(itemIndex, 1);
      }
      console.log(itemSet);
      Alpine.store("pageItemNew").itemSet = itemSet;
    },
    prodigi: {
      sku: "",
      description: "",
      attributes: [],
      selectedAttributes: {},
    },
    fieldValidations: {
      name: true,
      type: true,
      weight: true,
      prodigi: {
        sku: true,
      },
    },
    itemSetSelect: async function (itemId) {
      if (!itemId) {
        return;
      }
      Alpine.store("pageItemNew").itemSetAddItem = "";
      console.log(`Item: ${itemId} selected`);
      Alpine.store("loading", true);
      const itemRes = await makeStorelandRequest(
        `company/${Alpine.store("appCompany")._id}/item/${itemId}`,
        "GET"
      );
      console.table(itemRes);
      Alpine.store("loading", false);
      if (itemRes.status) {
        console.log("Successfully fetched item itemRes");
        const item = itemRes.item;
        console.table(item);
        Alpine.store("pageItemNew").itemSet.push({
          id: item._id,
          name: item.name,
          qty: 1,
        });
      } else {
        console.log("Error loading item item");
        Alpine.store("appAlert").show(
          "Something went wrong loading the selected item",
          itemRes.message,
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            location.reload();
          }
        );
      }
    },
    validateField: async function (fieldName) {
      const pageItemNew = Alpine.store("pageItemNew");
      switch (fieldName) {
        case "name":
          pageItemNew.fieldValidations.name = iodine.isValid(pageItemNew.name, [
            "required",
          ]);
        case "type":
          pageItemNew.fieldValidations.type = iodine.isValid(pageItemNew.type, [
            "required",
          ]);

          switch (pageItemNew.type) {
            case "itemSet":
              console.log("Fetching list of items");
              Alpine.store("loading", true);
              const itemListRes = await makeStorelandRequest(
                `company/${Alpine.store("appCompany")._id}/item`,
                "GET"
              );
              console.table(itemListRes);
              Alpine.store("loading", false);
              if (itemListRes.status) {
                console.log("Successfully fetched item list");
                const itemList = itemListRes.item.filter(function (item) {
                  if (item.type !== "itemSet") {
                    return item;
                  }
                });
                console.log(itemList);
                Alpine.store("pageItemNew").itemList = itemList;
              } else {
                console.log("Error loading item list");
                Alpine.store("appAlert").show(
                  "Something went wrong loading the item list",
                  itemListRes.message,
                  "Cancel",
                  "Try again",
                  "green",
                  true,
                  function () {
                    location.reload();
                  }
                );
              }
              break;
          }
          break;
        case "weight":
          pageItemNew.fieldValidations.weight =
            iodine.isValid(pageItemNew.weight, ["required"]) &&
            pageItemNew.weight >= 0;
          break;

        case "prodigi.sku":
          //We cant validate this is a valid sku in real time
          //As we need to check with prodigi to see if it exists
          //So we will just set it to true if it is not empty
          pageItemNew.fieldValidations.prodigi.sku = iodine.isValid(
            pageItemNew.prodigi.sku,
            ["required"]
          );
          pageItemNew.prodigi.description = "";
          pageItemNew.prodigi.attributes = [];
          pageItemNew.prodigi.selectedAttributes = {};
          //and here we will trigger the prodigi check
          if (pageItemNew.prodigi.sku) {
            //We need to check with prodigi to see if it exists
            Alpine.store("loading", true);
            makeStorelandRequest(
              `company/${Alpine.store("appCompany")._id}/prodigi/sku/${
                pageItemNew.prodigi.sku
              }`,
              "GET"
            )
              .then((response) => {
                console.table(response);
                Alpine.store("loading", false);
                if (response.status) {
                  //We have a valid sku
                  console.log(`SKU: ${response.sku.sku} is valid`);
                  pageItemNew.fieldValidations.prodigi.sku = true;
                  pageItemNew.prodigi.description = response.sku.description;
                  Object.keys(response.sku.attributes).forEach(
                    (attributeName) => {
                      pageItemNew.prodigi.attributes.push({
                        name: attributeName,
                        options: response.sku.attributes[attributeName],
                      });

                      pageItemNew.prodigi.selectedAttributes[attributeName] =
                        "";
                    }
                  );
                } else {
                  //We have an invalid sku
                  console.log(`SKU is invalid`);
                  pageItemNew.fieldValidations.prodigi.sku = false;
                  Alpine.store("appAlert").show(
                    "Invalid prodigi SKU",
                    `${pageItemNew.prodigi.sku} is an invalid SKU`,
                    "Cancel",
                    "OK",
                    "green",
                    false,
                    function () {
                      Alpine.store("appAlert").hide();
                    }
                  );
                }
              })
              .catch(function (error) {
                console.log(error);
                Alpine.store("appAlert").show(
                  "Error validating prodigi SKU",
                  `A network error occurred validating the SKU: ${pageItemNew.prodigi.sku}`,
                  "Cancel",
                  "Try again",
                  "green",
                  true,
                  function () {
                    Alpine.store("appAlert").hide();
                    Alpine.store("pageItemNew").validateField("prodigi.sku");
                  }
                );
              });
          }
          break;
      }
    },
    formSubmitError: function (title, message) {
      Alpine.store("appAlert").show(
        title,
        message,
        "Cancel",
        "Ok",
        "gray",
        false,
        function () {
          Alpine.store("appAlert").hide();
        }
      );
    },
    formSubmit: async function () {
      console.log("Validating new item data");
      const pageItemNew = Alpine.store("pageItemNew");
      if (!iodine.isValid(pageItemNew.name, ["required"])) {
        return pageItemNew.formSubmitError(
          "Item name required",
          "Please enter a name for this item"
        );
      }

      if (!iodine.isValid(pageItemNew.type, ["required"])) {
        return pageItemNew.formSubmitError(
          "Type required",
          "Please select a type for this item"
        );
      }

      const newItemData = {
        name: pageItemNew.name,
        type: pageItemNew.type,
      };

      switch (pageItemNew.type) {
        case "standard":
          if (
            !iodine.isValid(pageItemNew.weight, ["required"]) ||
            isNaN(pageItemNew.weight) ||
            pageItemNew.weight < 0
          ) {
            return pageItemNew.formSubmitError(
              "Weight required",
              "Please enter the weight of this item"
            );
          }
          newItemData.weight = pageItemNew.weight;
          break;
        case "prodigi":
          if (!iodine.isValid(pageItemNew.prodigi.sku, ["required"])) {
            return pageItemNew.formSubmitError(
              "Prodigi SKU required",
              "Please enter a Prodigi SKU for this item"
            );
          }
          newItemData.prodigi = {
            sku: pageItemNew.prodigi.sku,
            selectedAttributes: pageItemNew.prodigi.selectedAttributes,
          };

          for (const attributeName of Object.keys(
            newItemData.prodigi.selectedAttributes
          )) {
            const attributeValue =
              newItemData.prodigi.selectedAttributes[attributeName];
            console.log(attributeName, attributeValue);

            if (!attributeValue) {
              console.log(
                `Missing value for prodigi attribute: ${attributeName}`
              );
              return pageItemNew.formSubmitError(
                `Missing ${attributeName}`,
                `Please select a ${attributeName} for this item`
              );
            }
          }
          break;
        case "itemSet":
          //We need to check if the item set is valid again itemList
          const itemSet = pageItemNew.itemSet;
          newItemData.itemSet = itemSet;
          if (itemSet.length < 1) {
            return pageItemNew.formSubmitError(
              "Item set requires at least one item",
              "Please add at least one item to this item set"
            );
          }
          break;
        default:
          return pageItemNew.formSubmitError(
            `Unknown item type`,
            `Please select a an item type from the list`
          );
      }

      console.log("Submtting new item");
      console.table(newItemData);
      Alpine.store("loading", true);
      try {
        const newItemRes = await makeStorelandRequest(
          `company/${Alpine.store("appCompany")._id}/item`,
          "POST",
          newItemData
        );
        console.table(newItemRes);
        if (newItemRes.status) {
          console.log("Successfully created item");
          router.navigate(
            router.generate("item", {
              itemId: newItemRes.item._id,
            })
          );
        } else {
          console.log("API returned false status");
          Alpine.store("loading", false);
          Alpine.store("appAlert").show(
            "Something went wrong",
            newItemRes.message,
            "Cancel",
            "Try again",
            "green",
            true,
            function () {
              Alpine.store("appAlert").visible = false;
              Alpine.store("pageItemNew").formSubmit();
            }
          );
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error creating new item");
        console.log(error);
        Alpine.store("loading", false);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "A network error occured when creating this item",
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            Alpine.store("appAlert").visible = false;
            Alpine.store("pageItemNew").formSubmit();
          }
        );
      }
    },
  });
};

const loadItemPage = async function (params) {
  console.log("About to load the item item page, initing alpine data model");
  Alpine.store("selectedPage", "item");

  try {
    const itemRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/item/${params.itemId}`,
      "GET"
    );
    console.table(itemRes);
    if (itemRes.status) {
      const item = itemRes.item;
      Alpine.store("pageItem", item);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        itemRes.message,
        "Cancel",
        "Try again",
        "green",
        false,
        function () {
          location.reload();
        }
      );
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching item data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading item information. Please try again",
      "Cancel",
      "Try again",
      "green",
      false,
      function () {
        location.reload();
      }
    );
    return;
  }
};

export { loadItemNew, loadItemPage, loadItemEdit, loadItemList };
