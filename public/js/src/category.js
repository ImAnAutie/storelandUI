import { makeStorelandRequest } from "./storelandCORE.js";

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const loadCategoryNew = async function () {
  console.log("About to load the new category page, initing alpine data model");
  Alpine.store("selectedPage", "category");

  Alpine.store("pageCategoryNew", {
    name: "",
    parent: "",
    parentOptions: [{ name: "(No parent)", value: "" }],
    channel: "",
    channelOptions: [{ name: "(Test)", value: "" }],
    fieldValidations: {
      name: true,
    },
    channelSelected: async function () {
      const channelId = Alpine.store("pageCategoryNew").channel;
      console.log(`Select channel: ${channelId}`);
      Alpine.store("pageCategoryNew").parent = "";
      if (!channelId) {
        Alpine.store("pageCategoryNew").parentOptions = [
          { name: "(No parent)", value: "" },
        ];
        return;
      }
      try {
        const listCategoryRes = await makeStorelandRequest(
          `company/${
            Alpine.store("appCompany")._id
          }/channel/${channelId}/category`,
          "GET"
        );
        console.table(listCategoryRes);
        if (listCategoryRes.status) {
          console.log("Successfully fetched category list");
          const categoryList = listCategoryRes.category;
          categoryList.unshift({
            name: "(No parent)",
            value: "",
          });
          Alpine.store("pageCategoryNew").parentOptions = categoryList;
        } else {
          console.log("API returned false status");
          Alpine.store("loading", false);
          Alpine.store("appAlert").show(
            "Something went wrong",
            listCategoryRes.message,
            "Cancel",
            "Try again",
            "green",
            true,
            function () {
              Alpine.store("appAlert").visible = false;
              window.location.reload();
            }
          );
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error fetching list of categories");
        console.log(error);
        Alpine.store("loading", false);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "A network error occured when fetching the list of categories",
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            Alpine.store("appAlert").visible = false;
            window.location.reload();
          }
        );
      }
    },
    validateField: async function (fieldName) {
      const pageCategoryNew = Alpine.store("pageCategoryNew");
      switch (fieldName) {
        case "name":
          pageCategoryNew.fieldValidations.name = iodine.isValid(
            pageCategoryNew.name,
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
      console.log("Validating new category data");
      const pageCategoryNew = Alpine.store("pageCategoryNew");
      if (!iodine.isValid(pageCategoryNew.name, ["required"])) {
        return pageCategoryNew.formSubmitError(
          "Category name required",
          "Please enter a name for this category"
        );
      }

      const newCategoryData = {
        name: pageCategoryNew.name,
        parent: pageCategoryNew.parent,
        image: pageCategoryNew.image,
      };
      const channelId = Alpine.store("pageCategoryNew").channel;
      console.log("Submtting new category");
      console.table(newCategoryData);
      Alpine.store("loading", true);
      try {
        const newCategoryRes = await makeStorelandRequest(
          `company/${
            Alpine.store("appCompany")._id
          }/channel/${channelId}/category/`,
          "POST",
          newCategoryData
        );
        console.table(newCategoryRes);
        if (newCategoryRes.status) {
          console.log("Successfully created category");
          router.navigate(
            router.generate("category", {
              categoryId: newCategoryRes.category._id,
            })
          );
        } else {
          console.log("API returned false status");
          Alpine.store("loading", false);
          Alpine.store("appAlert").show(
            "Something went wrong",
            newCategoryRes.message,
            "Cancel",
            "Try again",
            "green",
            true,
            function () {
              Alpine.store("appAlert").visible = false;
              Alpine.store("pageCategoryNew").formSubmit();
            }
          );
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error creating new category");
        console.log(error);
        Alpine.store("loading", false);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "A network error occured when creating this category",
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            Alpine.store("appAlert").visible = false;
            Alpine.store("pageCategoryNew").formSubmit();
          }
        );
      }
    },
  });

  try {
    const listChannelRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/channel`,
      "GET"
    );
    console.table(listChannelRes);
    if (listChannelRes.status) {
      console.log("Successfully fetched channel list");
      Alpine.store("pageCategoryNew").channelOptions = listChannelRes.channel;
    } else {
      console.log("API returned false status");
      Alpine.store("loading", false);
      Alpine.store("appAlert").show(
        "Something went wrong",
        listChannelRes.message,
        "Cancel",
        "Try again",
        "green",
        true,
        function () {
          Alpine.store("appAlert").visible = false;
          window.location.reload();
        }
      );
      return;
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching list of new channels");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appAlert").show(
      "Something went wrong",
      "A network error occured when fetching the list of channels",
      "Cancel",
      "Try again",
      "green",
      true,
      function () {
        Alpine.store("appAlert").visible = false;
        window.location.reload();
      }
    );
  }
};

export { loadCategoryNew };
