const User = require("../../models/userSchema");

const customerInfo = async (req, res) => {
  try {
    // Search query
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    // Pagination
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page);
      if (isNaN(page) || page < 1) {
        page = 1; // Ensure page is at least 1
      }
    }
    const limit = 3;

    // Fetch users with search and pagination
    const userData = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
    .sort({createdAt:-1})
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Count total matching users
    const count = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Redirect to the last page if the requested page exceeds totalPages
    if (page > totalPages && totalPages > 0) {
      return res.redirect(`/admin/users?page=${totalPages}&search=${search}`);
    }

    // Render the users page
    res.render("admin/users", {
      users: userData,
      pageCSS: "/css/admin/users.css",
      pageScript: "/js/admin/users.js",
      totalPages: totalPages,
      currentPage: page,
      search: search,
    });
  } catch (error) {
    console.error("Error in customerInfo:", error);
    // Optionally, log to a file or service in production
    res.status(500).render("admin/error", {
      message: "An error occurred while fetching user data.",
    });
  }
};

const toggleBlockStatus= async(req,res)=>{
  try {
    const {userId,isBlocked}=req.body;
    await User.updateOne(
      {_id:userId},
      {$set:{isBlocked}}
    )
    res.status(200).json({
  success: true,
  message: `User ${isBlocked ? "blocked" : "unblocked"} successfully` // Fix: isBlocked
});
  } catch (error) {
    res.status(500).json({
      success:false,
      message:"Failed to update user status",
    })
  }
}

module.exports = { customerInfo,
  toggleBlockStatus

 };