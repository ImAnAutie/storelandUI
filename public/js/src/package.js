import { makeStorelandRequest } from "./storelandCORE.js";

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const loadPackageList = async function () {
  console.log("About to load the package list page, initing alpine data model");
  Alpine.store("selectedPage", "package");
  try {
    const packageRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/package`,
      "GET"
    );
    console.table(packageRes);
    if (packageRes.status) {
      Alpine.store("pagePackageList", packageRes.package);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        packageRes.message,
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
    console.log("Error fetching package data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading package information. Please try again",
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

const loadPackageNew = async function () {
  console.log("About to load the new package page, initing alpine data model");
  Alpine.store("selectedPage", "package");

  Alpine.store("loading", true);
  let itemList = [];
  const itemListRes = await makeStorelandRequest(
    `company/${Alpine.store("appCompany")._id}/item`,
    "GET"
  );
  console.table(itemListRes);
  Alpine.store("loading", false);
  if (itemListRes.status) {
    console.log("Successfully fetched item list");
    itemList = itemListRes.item;
    console.log(itemList);
  } else {
    console.log("Error loading item list");
    Alpine.store("appAlert").show(
      "Something went wrong loading the list of items",
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

  Alpine.store("pagePackageNew", {
    name: "",
    itemList: itemList,
    items: [],
    itemsAddItem: "",
    attributes: [],
    updateVariantAttributeList: function () {
      const attributes = Alpine.store("pagePackageNew").attributes;
      const variants = Alpine.store("pagePackageNew").variants;
      for (const variant of variants) {
        variant.attributes = [];
        for (const attribute of attributes) {
          variant.attributes.push({
            name: attribute.name,
            selected: "",
            options: attribute.options,
          });
        }
      }
    },
    attributeAddOption: function (attributeIndex) {
      const attribute =
        Alpine.store("pagePackageNew").attributes[attributeIndex];
      // Check if we are attempting to add an empty option
      if (!attribute.optionToAdd) {
        return;
      }
      // Check if option already exists
      if (attribute.options.indexOf(attribute.optionToAdd) !== -1) {
        return;
      }
      attribute.options.push(attribute.optionToAdd);
      attribute.optionToAdd = "";
      Alpine.store("pagePackageNew").updateVariantAttributeList();
    },
    removeAttributeOption: function (attributeIndex, optionIndex) {
      console.log(attributeIndex, optionIndex);
      Alpine.store("pagePackageNew").attributes[attributeIndex].options.splice(
        optionIndex,
        1
      );
      Alpine.store("pagePackageNew").updateVariantAttributeList();
    },
    removeAttribute: function (attributeIndex) {
      Alpine.store("pagePackageNew").attributes.splice(attributeIndex, 1);
      Alpine.store("pagePackageNew").updateVariantAttributeList();
    },
    newAttribute: function () {
      Alpine.store("pagePackageNew").attributes.push({
        name: "",
        options: [],
      });
      Alpine.store("pagePackageNew").updateVariantAttributeList();
    },
    variants: [],
    removeVariant: function (variantIndex) {
      Alpine.store("pagePackageNew").variants.splice(variantIndex, 1);
    },
    newVariant: function () {
      const newVariant = {
        name: "",
        price: 0,
        items: [],
        attributes: [],
      };
      for (const attribute of Alpine.store("pagePackageNew").attributes) {
        console.log(attribute);

        newVariant.attributes.push({
          name: attribute.name,
          selected: "",
          options: attribute.options,
        });
      }
      Alpine.store("pagePackageNew").variants.push(newVariant);
    },
    itemIncrement: function (variantIndex, itemId, incrementAmount) {
      console.log(itemId, incrementAmount);
      //Fix for a weird bug where removing the first item
      //set the following one to qty 0

      console.log(variantIndex);
      const variant = JSON.parse(
        JSON.stringify(Alpine.store("pagePackageNew").variants[variantIndex])
      );
      console.log(variant.items);
      const itemIndex = variant.items.findIndex((item) => item.id == itemId);
      console.log(itemIndex);
      const item = variant.items[itemIndex];
      console.table(item);
      item.qty = item.qty + incrementAmount;
      console.table(item);
      if (item.qty <= 0) {
        console.log(
          `Package item qty zero or less for: ${item.name} ${item.id}, removing`
        );
        variant.items.splice(itemIndex, 1);
      }
      console.log(variant.items);
      Alpine.store("pagePackageNew").variants[variantIndex] = variant;
    },
    fieldValidations: {
      name: true,
      image: true,
    },
    itemSelect: async function (variantIndex, itemId) {
      if (!itemId) {
        return;
      }
      console.log(variantIndex);
      const variant = Alpine.store("pagePackageNew").variants[variantIndex];
      Alpine.store("pagePackageNew").itemAddItem = null;
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
        variant.items.push({
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
      const pagePackageNew = Alpine.store("pagePackageNew");
      switch (fieldName) {
        case "name":
          pagePackageNew.fieldValidations.name = iodine.isValid(
            pagePackageNew.name,
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
      console.log("Validating new package data");
      const pagePackageNew = Alpine.store("pagePackageNew");
      if (!iodine.isValid(pagePackageNew.name, ["required"])) {
        return pagePackageNew.formSubmitError(
          "Package name required",
          "Please enter a name for this package"
        );
      }
      if (!iodine.isValid(pagePackageNew.image, ["required"])) {
        return pagePackageNew.formSubmitError(
          "Package image required",
          "Please upload an image for this package"
        );
      }

      //Validate attributes
      for (const attribute of Alpine.store("pagePackageNew").attributes) {
        //Is attribute missing a name?
        if (!attribute.name) {
          return Alpine.store("pagePackageNew").formSubmitError(
            "Attribute name required",
            "All package attributes require a name"
          );
        }
        //Is attribute missing options?
        if (!attribute.options.length) {
          return Alpine.store("pagePackageNew").formSubmitError(
            "Attribute options required",
            `The ${attribute.name} attribute for this package is missing options`
          );
        }
      }

      //Validate variants
      if (!Alpine.store("pagePackageNew").variants.length) {
        return Alpine.store("pagePackageNew").formSubmitError(
          "Variants required",
          "You must create at least one variant for this package"
        );
      }
      for (const variant of Alpine.store("pagePackageNew").variants) {
        //Is variant missing a name?
        if (!variant.name) {
          return Alpine.store("pagePackageNew").formSubmitError(
            "Variant name required",
            "All package variants require a name"
          );
        }
        //Is variant missing a price?
        if (variant.price == "" || isNaN(variant.price) || variant.price < 0) {
          return Alpine.store("pagePackageNew").formSubmitError(
            "Variant price required",
            `Missing price for variant ${variant.name}`
          );
        }
        //Is variant missing items?
        if (!variant.items.length) {
          return Alpine.store("pagePackageNew").formSubmitError(
            "Variant items required",
            `The ${variant.name} variant for this package is missing items`
          );
        }
      }

      const newPackageData = {
        name: pagePackageNew.name,
        image: pagePackageNew.image,
        attributes: pagePackageNew.attributes,
        variants: pagePackageNew.variants,
      };

      console.log("Submtting new package");
      console.table(newPackageData);
      Alpine.store("loading", true);
      try {
        const newPackageRes = await makeStorelandRequest(
          `company/${Alpine.store("appCompany")._id}/package`,
          "POST",
          newPackageData
        );
        console.table(newPackageRes);
        if (newPackageRes.status) {
          console.log("Successfully created package");
          router.navigate(
            router.generate("package", {
              packageId: newPackageRes.package._id,
            })
          );
        } else {
          console.log("API returned false status");
          Alpine.store("loading", false);
          Alpine.store("appAlert").show(
            "Something went wrong",
            newPackageRes.message,
            "Cancel",
            "Try again",
            "green",
            true,
            function () {
              Alpine.store("appAlert").visible = false;
              Alpine.store("pagePackageNew").formSubmit();
            }
          );
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error creating new package");
        console.log(error);
        Alpine.store("loading", false);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "A network error occured when creating this package",
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            Alpine.store("appAlert").visible = false;
            Alpine.store("pagePackageNew").formSubmit();
          }
        );
      }
    },
  });
};

const loadPackagePage = async function (params) {
  console.log(
    "About to load the package package page, initing alpine data model"
  );
  Alpine.store("selectedPage", "package");

  try {
    const packageRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/package/${params.packageId}`,
      "GET"
    );
    console.table(packageRes);
    if (packageRes.status) {
      //package is a JS reserved keyword
      const packageObject = packageRes.package;
      console.log(packageObject);
      Alpine.store("pagePackage", packageObject);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        packageRes.message,
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
    console.log("Error fetching package data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading package information. Please try again",
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

const loadPackageEdit = async function (params) {
  console.log("About to load the package edit page, initing alpine data model");
  Alpine.store("selectedPage", "package");
  console.log(params);

  try {
    const packageRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/package/${params.packageId}`,
      "GET"
    );
    console.table(packageRes);
    if (packageRes.status) {
      const packageObject = packageRes.package;
      Object.assign(packageObject, {
        fieldValidations: {
          name: true,
          image: true,
        },
        validateField: function (fieldName) {
          const pagePackageEdit = Alpine.store("pagePackageEdit");
          switch (fieldName) {
            case "name":
              pagePackageEdit.fieldValidations.name = iodine.isValid(
                pagePackageEdit.name,
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
          console.log("Validating package data");
          const pagePackageEdit = Alpine.store("pagePackageEdit");
          if (!iodine.isValid(pagePackageEdit.name, ["required"])) {
            return pagePackageEdit.formSubmitError(
              "Package name required",
              "Please enter a package name"
            );
          }
          if (!iodine.isValid(pagePackageEdit.image, ["required"])) {
            return pagePackageEdit.formSubmitError(
              "Package image required",
              "Please provide an image for this package"
            );
          }

          const editPackageData = {
            name: pagePackageEdit.name,
            image: pagePackageEdit.image,
          };
          console.log("Submtting package edit");
          console.table(editPackageData);
          Alpine.store("loading", true);
          try {
            const editPackageRes = await makeStorelandRequest(
              `company/${Alpine.store("appCompany")._id}/package/${
                pagePackageEdit._id
              }`,
              "PATCH",
              editPackageData
            );
            console.table(editPackageRes);
            if (editPackageRes.status) {
              console.log("Successfully edited package");
              //@todo some sort of toast?
              const packageObject = editPackageRes.package;
              router.navigate(
                router.generate("package", {
                  packageId: packageObject._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                editPackageRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pagePackageEdit").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            //@TOOO report this
            console.log("Error editing package");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured when editing this package",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pagePackageEdit").formSubmit();
              }
            );
          }
        },
      });

      packageObject.deleteConfirm = {
        visible: false,
        name: "",
        confirm: async function () {
          const pagePackageEdit = Alpine.store("pagePackageEdit");
          if (
            Alpine.store("pagePackageEdit").deleteConfirm.name ==
            Alpine.store("pagePackageEdit").name
          ) {
            console.log("Deleting package now it's confirmed");
            Alpine.store("pagePackageEdit").deleteConfirm.visible = false;
            Alpine.store("loading", true);
            try {
              const deletePackageRes = await makeStorelandRequest(
                `company/${Alpine.store("appCompany")._id}/package/${
                  pagePackageEdit._id
                }`,
                "DELETE"
              );
              console.table(deletePackageRes);
              if (deletePackageRes.status) {
                console.log("Successfully deleted package");
                router.navigate(router.generate("package.list"));
              } else {
                console.log("API returned false status");
                Alpine.store("loading", false);
                Alpine.store("appAlert").show(
                  "Something went wrong",
                  deletePackageRes.message,
                  "Cancel",
                  "Try again",
                  "green",
                  true,
                  function () {
                    Alpine.store("appAlert").visible = false;
                    Alpine.store("pagePackageEdit").deleteConfirm.confirm();
                  }
                );
                return;
              }
            } catch (error) {
              //@TOOO report this
              console.log("Error deleting package");
              console.log(error);
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                "A network error occured when deleting this package",
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pagePackageEdit").deleteConfirm.confirm();
                }
              );
            }
          }
        },
      };
      packageObject.delete = function () {
        Alpine.store("appAlert").show(
          "Are you sure?",
          "Deleting this package will remove it from sale, This CANNOT be undone.",
          "Cancel",
          "Yes, delete this package",
          "red",
          true,
          function () {
            Alpine.store("appAlert").hide();
            Alpine.store("pagePackageEdit").deleteConfirm.name = "";
            Alpine.store("pagePackageEdit").deleteConfirm.visible = true;
          }
        );
      };
      Alpine.store("pagePackageEdit", packageObject);
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading package information. Please try again",
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
    console.log("Error fetching package data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading package information. Please try again",
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

const loadPackageAssignment = async function (params) {
  console.log(
    "About to load the package assignment page, initing alpine data model"
  );
  Alpine.store("selectedPage", "package");
  console.log(params);

  try {
    const packageRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/package/${params.packageId}`,
      "GET"
    );
    console.table(packageRes);
    if (packageRes.status) {
      const packageObject = packageRes.package;
      Object.assign(packageObject, {
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
          const assignedChannels = Alpine.store("pagePackageAssignment")
            .channelOptions.filter(function (channelOption) {
              return channelOption.assigned;
            })
            .map(function (channelOption) {
              return channelOption._id;
            });
          console.log(`Submitting channel assignments`);
          console.log(assignedChannels);
          const assignedChannelsData = {
            assignedChannels: assignedChannels,
          };
          console.log(assignedChannelsData);
          try {
            const assignmentPostRes = await makeStorelandRequest(
              `company/${Alpine.store("appCompany")._id}/package/${
                Alpine.store("pagePackageAssignment")._id
              }/assignment`,
              "PATCH",
              assignedChannelsData
            );
            if (assignmentPostRes.status) {
              console.log("Successfully posted channel assignments");
              //@todo some sort of toast?
              router.navigate(
                router.generate("package", {
                  packageId: packageObject._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                assignmentPostRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pagePackageAssignment").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            console.log("Network error");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured assigning channels to this package",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pagePackageAssignment").formSubmit();
              }
            );
            return;
          }
        },
      });
      const channelRes = await makeStorelandRequest(
        `company/${Alpine.store("appCompany")._id}/channel`
      );
      if (!channelRes.status) {
        console.log("API returned false status, something went wrong");
        Alpine.store("loading", false);
        Alpine.store("appLoading", true);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "Failed loading channel information. Please try again",
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
      packageObject.channelOptions = channelRes.channel;
      Alpine.store("pagePackageAssignment", packageObject);
      for (const channelId of Alpine.store("pagePackageAssignment")
        .assignedChannels) {
        Alpine.store("pagePackageAssignment").channelOptions.find(function (
          channelOption
        ) {
          return channelOption._id == channelId;
        }).assigned = true;
      }
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading package information. Please try again",
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
    console.log("Error fetching package data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading package information. Please try again",
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

const loadPackageCategory = async function (params) {
  console.log(
    "About to load the package channel page, initing alpine data model"
  );
  Alpine.store("selectedPage", "package");
  console.log(params);

  try {
    const packageRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/package/${params.packageId}`,
      "GET"
    );
    console.table(packageRes);
    if (packageRes.status) {
      const packageObject = packageRes.package;
      Object.assign(packageObject, {
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
          const assignedCategories = Alpine.store("pagePackageCategory")
            .categoryOptions.filter(function (categoryOption) {
              return categoryOption.assigned;
            })
            .map(function (channelOption) {
              return channelOption._id;
            });
          console.log(`Submitting category assignments`);
          console.log(assignedCategories);
          const assignedCategoriesData = {
            assignedCategories: assignedCategories,
          };
          console.log(assignedCategoriesData);
          try {
            const categoryPostRes = await makeStorelandRequest(
              `company/${Alpine.store("appCompany")._id}/package/${
                Alpine.store("pagePackageCategory")._id
              }/category`,
              "PATCH",
              assignedCategoriesData
            );
            if (categoryPostRes.status) {
              console.log("Successfully posted category assignments");
              //@todo some sort of toast?
              router.navigate(
                router.generate("package", {
                  packageId: packageObject._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                categoryPostRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pagePackageCategory").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            console.log("Network error");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured assigning categories to this package",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pagePackageAssignment").formSubmit();
              }
            );
            return;
          }
        },
      });
      const channelRes = await makeStorelandRequest(
        `company/${Alpine.store("appCompany")._id}/channel`
      );
      if (!channelRes.status) {
        console.log("API returned false status, something went wrong");
        Alpine.store("loading", false);
        Alpine.store("appLoading", true);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "Failed loading channel information. Please try again",
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
      const channel = channelRes.channel;
      console.log(channel);
      //@todo filter for channels assigned to this package
      const categoryRes = await Promise.all(
        channel.map(function (channel) {
          return makeStorelandRequest(
            `company/${Alpine.store("appCompany")._id}/channel/${
              channel._id
            }/category`
          );
        })
      );
      console.log(categoryRes);

      if (
        categoryRes.length !==
        categoryRes.filter(function (indCategoryRes) {
          return indCategoryRes.status == true;
        }).length
      ) {
        console.log(
          "API returned false status (for at least one category), something went wrong"
        );
        Alpine.store("loading", false);
        Alpine.store("appLoading", true);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "Failed loading category information. Please try again",
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
      const categoryOptions = [].concat
        .apply(
          [],
          categoryRes.map(function (categoryList) {
            return categoryList.category;
          })
        )
        .map(function (category) {
          category.channel = channel.find(function (indChannel) {
            return indChannel._id == category.channel;
          });
          return category;
        });

      packageObject.categoryOptions = categoryOptions;

      Alpine.store("pagePackageCategory", packageObject);
      for (const categoryId of Alpine.store("pagePackageCategory")
        .assignedCategories) {
        Alpine.store("pagePackageCategory").categoryOptions.find(function (
          categoryOption
        ) {
          return categoryOption._id == categoryId;
        }).assigned = true;
      }
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading package information. Please try again",
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
    console.log("Error fetching package data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading package information. Please try again",
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

export {
  loadPackageList,
  loadPackageNew,
  loadPackagePage,
  loadPackageEdit,
  loadPackageAssignment,
  loadPackageCategory,
};
