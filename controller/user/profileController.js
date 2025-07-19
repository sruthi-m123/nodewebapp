const path = require("path");
const fs = require("fs");
const User = require("../../models/userSchema");

class profileController {
  // GET /profile
  static async getProfile(req, res) {
    try {
      const userId = req.session?.user?._id || req.user?._id;
      if (!userId) return res.redirect("/login?error=session_lost");

      const user = await User.findById(userId).select("-password -googleId -isBlocked -isAdmin");
console.log("user avatar",user.avatar)
      res.render("user/profile", {
        activeTab: "profile",
        user: {
name: user.name || "",
          email: user.email,
          phone: user.phone,
          gender: user.gender || "Prefer not say",
          avatar: user.avatar|| "/img/admin-products.png",
        },
      });
    } catch (error) {
      console.error("Profile load error:", error);
      res.redirect("/error");
    }
  }

  // GET /profile/edit
    static async getEditProfile(req, res) {
    try {
      const userId = req.session?.user?._id || req.user?._id;
      if (!userId) return res.redirect("/login?error=session_lost");

      const user = await User.findById(userId);
      if (!user) return res.redirect("/login?error=user_not_found");

      res.render("user/editProfile", {
        activeTab: "profile",
        user: {
          name: user.name || "",
          email: user.email,
          phone: user.phone || "",
          gender: user.gender || "Prefer not say",
          avatar: user.avatar || "/img/admin-products.png", // show stored avatar
        }
      });
    } catch (error) {
      console.error("Edit profile page load error:", error);
      res.redirect("/error");
    }
  }

  // POST /profile/update
  static async postEditProfile(req, res) {
  try {
    const userId = req.session?.user?._id || req.user?._id;
    if (!userId) return res.redirect("/login?error=session_lost");

    const { name, phone, gender } = req.body;

    const updateData = {
      name,
      phone,
      gender,
    };

    console.log("this is for debugging:", req.file);

    let updatedAvatarUrl = null;

    if (req.file) {
      updatedAvatarUrl = `/img/uploads/avatar/${req.file.filename}`;
      updateData.avatar = updatedAvatarUrl;

      // Remove old avatar if it's not the default
      const oldUser = await User.findById(userId);
      if (oldUser?.avatar && oldUser.avatar.startsWith("/img/uploads/")) {
        const oldPath = path.join(__dirname, "../../public", oldUser.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.json({
      success: true,
      updatedAvatarUrl: updateData.avatar || null,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.redirect("/profile/edit?error=update_failed");
  }
}
}

module.exports = profileController;
