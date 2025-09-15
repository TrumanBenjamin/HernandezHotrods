const { fetchInstagramPosts } = require('../services/instagram');

exports.homePage = async (req, res) => {
  try {
    const igPosts = await fetchInstagramPosts(4); // grab 4 posts
    res.render('home', { 
      title: 'Home',
      isHome: true,
      igPosts
    });
  } catch (err) {
    console.error('Error fetching Instagram posts:', err);
    res.render('home', { 
      title: 'Home',
      isHome: true,
      igPosts: [] // fallback to empty list
    });
  }
};
