import { makeStorelandRequest } from "./storelandCORE.js";

import { Iodine } from "@kingshott/iodine";
const iodine = new Iodine();

const loadChannelEdit = async function (params) {
  console.log("About to load the channel edit page, initing alpine data model");
  Alpine.store("selectedPage", "channel");
  console.log(params);

  // Load the brand list
  let brandList = [];
  try {
    const brandRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand`,
      "GET"
    );
    console.table(brandRes);
    if (brandRes.status) {
      brandList = brandRes.brand;
      if (!brandList.length) {
        return Alpine.store("appAlert").show(
          "Missing brand",
          "No brands found.",
          "Cancel",
          "Retry",
          "green",
          false,
          function () {
            location.href = "/brand";
          }
        );
      }
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      return Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading brand information. Please try again",
        "Cancel",
        "Try again",
        "green",
        false,
        function () {
          location.reload();
        }
      );
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching brand data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    return Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading brand information. Please try again",
      "Cancel",
      "Try again",
      "green",
      false,
      function () {
        location.reload();
      }
    );
  }

  try {
    const channelRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand/${
        params.brandId
      }/channel/${params.channelId}`,
      "GET"
    );
    console.table(channelRes);
    if (channelRes.status) {
      const channel = channelRes.channel;
      Object.assign(channel, {
        fieldValidations: {
          name: true,
          brand: true,
        },
        validateField: function (fieldName) {
          const pageChannelEdit = Alpine.store("pageChannelEdit");
          switch (fieldName) {
            case "name":
              pageChannelEdit.fieldValidations.name = iodine.isValid(
                pageChannelEdit.name,
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
          console.log("Validating brand data");
          const pageChannelEdit = Alpine.store("pageChannelEdit");
          if (!iodine.isValid(pageChannelEdit.name, ["required"])) {
            return pageChannelEdit.formSubmitError(
              "Channel name required",
              "Please enter a channel name"
            );
          }

          const editChannelData = {
            name: pageChannelEdit.name,
          };
          console.log("Submtting edit to channel");
          console.table(editChannelData);

          Alpine.store("loading", true);
          try {
            const editChannelRes = await makeStorelandRequest(
              `company/${Alpine.store("appCompany")._id}/brand/${
                pageChannelEdit.brand
              }/channel/${pageChannelEdit._id}`,
              "PATCH",
              editChannelData
            );
            console.table(editChannelRes);
            if (editChannelRes.status) {
              console.log("Successfully edited channel");
              //@todo some sort of toast?
              const channel = editChannelRes.channel;
              router.navigate(
                router.generate("channel", {
                  brandId: pageChannelEdit.brand,
                  channelId: channel._id,
                })
              );
            } else {
              console.log("API returned false status");
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                editChannelRes.message,
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageChannelEdit").formSubmit();
                }
              );
              return;
            }
          } catch (error) {
            //@TOOO report this
            console.log("Error editing channel");
            console.log(error);
            Alpine.store("loading", false);
            Alpine.store("appAlert").show(
              "Something went wrong",
              "A network error occured when editing this channel",
              "Cancel",
              "Try again",
              "green",
              true,
              function () {
                Alpine.store("appAlert").visible = false;
                Alpine.store("pageChannelEdit").formSubmit();
              }
            );
          }
        },
      });

      channel.deleteConfirm = {
        visible: false,
        name: "",
        confirm: async function () {
          const pageChannelEdit = Alpine.store("pageChannelEdit");
          if (
            Alpine.store("pageChannelEdit").deleteConfirm.name ==
            Alpine.store("pageChannelEdit").name
          ) {
            console.log("Deleting brand now it's confirmed");
            Alpine.store("pageChannelEdit").deleteConfirm.visible = false;
            Alpine.store("loading", true);
            try {
              const deleteChannelRes = await makeStorelandRequest(
                `company/${Alpine.store("appCompany")._id}/brand/${
                  pageChannelEdit.brand
                }/channel/${pageChannelEdit._id}`,
                "DELETE"
              );
              console.table(deleteChannelRes);
              if (deleteChannelRes.status) {
                console.log("Successfully deleted channel");
                router.navigate(router.generate("channel.list"));
              } else {
                console.log("API returned false status");
                Alpine.store("loading", false);
                Alpine.store("appAlert").show(
                  "Something went wrong",
                  deleteChannelRes.message,
                  "Cancel",
                  "Try again",
                  "green",
                  true,
                  function () {
                    Alpine.store("appAlert").visible = false;
                    Alpine.store("pageChannelEdit").deleteConfirm.confirm();
                  }
                );
                return;
              }
            } catch (error) {
              //@TOOO report this
              console.log("Error deleting channel");
              console.log(error);
              Alpine.store("loading", false);
              Alpine.store("appAlert").show(
                "Something went wrong",
                "A network error occured when deleting this channel",
                "Cancel",
                "Try again",
                "green",
                true,
                function () {
                  Alpine.store("appAlert").visible = false;
                  Alpine.store("pageChannelEdit").deleteConfirm.confirm();
                }
              );
            }
          }
        },
      };
      channel.delete = function () {
        Alpine.store("appAlert").show(
          "Are you sure?",
          "Deleting this channel will delete all orders etc.. This CANNOT be undone.",
          "Cancel",
          "Yes, delete this channel",
          "red",
          true,
          function () {
            Alpine.store("appAlert").hide();
            Alpine.store("pageChannelEdit").deleteConfirm.name = "";
            Alpine.store("pageChannelEdit").deleteConfirm.visible = true;
          }
        );
      };
      Alpine.store("pageChannelEdit", channel);
    } else {
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
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching channel data");
    console.log(error);
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
};
const loadChannelNew = async function () {
  console.log("About to load the new channel page, initing alpine data model");
  Alpine.store("selectedPage", "channel");

  // Load the brand list
  let brandList = [];
  try {
    const brandRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand`,
      "GET"
    );
    console.table(brandRes);
    if (brandRes.status) {
      brandList = brandRes.brand;
      if (!brandList.length) {
        return Alpine.store("appAlert").show(
          "Missing brand",
          "You need to create a brand before you can create a channel",
          "Cancel",
          "Create brand",
          "green",
          false,
          function () {
            Alpine.store("appAlert").hide();
            router.navigate(router.generate("brand.new"));
          }
        );
      }
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      return Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading brand information. Please try again",
        "Cancel",
        "Try again",
        "green",
        false,
        function () {
          location.reload();
        }
      );
    }
  } catch (error) {
    //@TOOO rep ort this
    console.log("Error fetching brand data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    return Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading brand information. Please try again",
      "Cancel",
      "Try again",
      "green",
      false,
      function () {
        location.reload();
      }
    );
  }

  Alpine.store("pageChannelNew", {
    name: "",
    brand: "",
    type: "",
    fieldValidations: {
      name: true,
      brand: true,
      type: true,
    },
    brandList: brandList,
    validateField: function (fieldName) {
      const pageChannelNew = Alpine.store("pageChannelNew");
      switch (fieldName) {
        case "name":
          pageChannelNew.fieldValidations.name = iodine.isValid(
            pageChannelNew.name,
            ["required"]
          );
        case "brand":
          pageChannelNew.fieldValidations.brand = iodine.isValid(
            pageChannelNew.brand,
            ["required"]
          );
          break;
        case "type":
          pageChannelNew.fieldValidations.type = iodine.isValid(
            pageChannelNew.type,
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
      console.log("Validating new channel data");
      const pageChannelNew = Alpine.store("pageChannelNew");
      if (!iodine.isValid(pageChannelNew.name, ["required"])) {
        return pageChannelNew.formSubmitError(
          "Channel name required",
          "Please enter a channel name"
        );
      }

      if (!iodine.isValid(pageChannelNew.brand, ["required"])) {
        return pageChannelNew.formSubmitError(
          "Brand required",
          "Please select a brand for this channel"
        );
      }
      if (!iodine.isValid(pageChannelNew.type, ["required"])) {
        return pageChannelNew.formSubmitError(
          "Type required",
          "Please select a type for this channel"
        );
      }

      const newChannelData = {
        name: pageChannelNew.name,
        type: pageChannelNew.type,
      };
      console.log("Submtting new channel");
      console.table(newChannelData);
      Alpine.store("loading", true);
      try {
        const newChannelRes = await makeStorelandRequest(
          `company/${Alpine.store("appCompany")._id}/brand/${
            pageChannelNew.brand
          }/channel`,
          "POST",
          newChannelData
        );
        console.table(newChannelRes);
        if (newChannelRes.status) {
          console.log("Successfully created channel");
          router.navigate(
            router.generate("channel", {
              brandId: pageChannelNew.brand,
              channelId: newChannelRes.channel._id,
            })
          );
        } else {
          console.log("API returned false status");
          Alpine.store("loading", false);
          Alpine.store("appAlert").show(
            "Something went wrong",
            newChannelRes.message,
            "Cancel",
            "Try again",
            "green",
            true,
            function () {
              Alpine.store("appAlert").visible = false;
              Alpine.store("pageChannelNew").formSubmit();
            }
          );
          return;
        }
      } catch (error) {
        //@TOOO report this
        console.log("Error creating new channel");
        console.log(error);
        Alpine.store("loading", false);
        Alpine.store("appAlert").show(
          "Something went wrong",
          "A network error occured when creating this channel",
          "Cancel",
          "Try again",
          "green",
          true,
          function () {
            Alpine.store("appAlert").visible = false;
            Alpine.store("pageChannelNew").formSubmit();
          }
        );
      }
    },
  });
};

const loadChannelPage = async function (params) {
  console.log(
    "About to load the channel channel page, initing alpine data model"
  );
  Alpine.store("selectedPage", "channel");

  try {
    const channelRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand/${
        params.brandId
      }/channel/${params.channelId}`,
      "GET"
    );
    console.table(channelRes);
    if (channelRes.status) {
      const channel = channelRes.channel;
      Alpine.store("pageChannel", channel);
    } else {
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
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching channel data");
    console.log(error);
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
};

const loadChannelList = async function () {
  console.log("About to load the channel list page, initing alpine data model");
  Alpine.store("selectedPage", "channel");

  // Load the brand list
  let brandList = [];
  try {
    const brandRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/brand`,
      "GET"
    );
    console.table(brandRes);
    if (brandRes.status) {
      brandList = brandRes.brand;
      console.log(brandList);
      if (!brandList.length) {
        return Alpine.store("appAlert").show(
          "Missing brand",
          "No brands found.",
          "Cancel",
          "Retry",
          "green",
          false,
          function () {
            location.href = "/brand";
          }
        );
      }
    } else {
      console.log("API returned false status, something went wrong");
      Alpine.store("loading", false);
      Alpine.store("appLoading", true);
      return Alpine.store("appAlert").show(
        "Something went wrong",
        "Failed loading brand information. Please try again",
        "Cancel",
        "Try again",
        "green",
        false,
        function () {
          location.reload();
        }
      );
    }
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching brand data");
    console.log(error);
    Alpine.store("loading", false);
    Alpine.store("appLoading", true);
    return Alpine.store("appAlert").show(
      "Something went wrong",
      "Failed loading brand information. Please try again",
      "Cancel",
      "Try again",
      "green",
      false,
      function () {
        location.reload();
      }
    );
  }

  try {
    const channelRes = await makeStorelandRequest(
      `company/${Alpine.store("appCompany")._id}/channel`,
      "GET"
    );
    console.table(channelRes);
    if (channelRes.status) {
      const channelList = channelRes.channel;

      for (const index in channelList) {
        const channel = channelList[index];
        const brand = brandList.find((i) => i._id == channel.brand);
        if (brand) {
          channel.brand = brand;
        } else {
          channel.brand = {
            name: "**Invalid brand**",
          };
        }

        channelList[index] = channel;
      }
      Alpine.store("pageChannelList", channelList);
    } else {
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
  } catch (error) {
    //@TOOO report this
    console.log("Error fetching channel data");
    console.log(error);
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
};

export { loadChannelNew, loadChannelPage, loadChannelEdit, loadChannelList };
