const Product=require(`../../models/productSchema`);
const renderProducts=async(req,res)=>{
    try {
       const products = await Product.find().sort({ createdAt: -1 });
      res.render('admin/products', { 
        title: 'Product Management',
        pageCSS: '/css/admin/products.css', 
            script: '/js/admin/products.js' , 
        products 
      }); 
    } catch (error) {
        console.error(err);
      res.status(500).render('admin/error', { error: 'Failed to load products' });
    }
}
const addProduct=async(req,res)=>{
    try {
         const { name, description, price, stock } = req.body;
      const image = req.file ? req.file.path : '';
      
      const newProduct = new Product({
        name,
        description,
        price,
        stock,
        image
      });

      await newProduct.save();
      req.flash('success', 'Product added successfully');
      res.redirect('/admin/products');  
    } catch (error) {
        console.error(err);
      req.flash('error', 'Failed to add product');
      res.redirect('/admin/products/add');
    }
}
const updateProduct=async(req,res)=>{
    try {
        const { id } = req.params;
      const { name, description, price, stock } = req.body;
      const updateData = { name, description, price, stock };

      if (req.file) {
        updateData.image = req.file.path;
      }

      await Product.findByIdAndUpdate(id, updateData);
      req.flash('success', 'Product updated successfully');
      res.redirect('/admin/products');
    } catch (error) {
              console.error(err);
      req.flash('error', 'Failed to update product');
      res.redirect(`/admin/products/edit/${id}`);

    }
}
const deleteProduct=async(req,res)=>{
    try {
        const { id } = req.params;
      await Product.findByIdAndDelete(id);
      req.flash('success', 'Product deleted successfully');
      res.redirect('/admin/products');
    } catch (error) {
        console.error(err);
      req.flash('error', 'Failed to delete product');
      res.redirect('/admin/products');
    }
    }

const renderForm=async(req,res)=>{
    res.render('admin/add-product', { title: 'Add New Product' });
  }

const renderEditForm=async(req,res)=>{
    try {
      const product = await Product.findById(req.params.id);
      res.render('admin/edit-product', { 
        title: 'Edit Product',
        product 
      });  
    } catch (error) {
        console.error(err);
      res.redirect('/admin/products');
    }
}

module.exports={
    renderProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    renderForm,
    renderEditForm

}