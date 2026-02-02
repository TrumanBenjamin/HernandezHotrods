const { fetchInstagramPosts } = require('../services/instagram');

exports.homePage = async (req, res) => {
  try {
    const igPosts = await fetchInstagramPosts(3); // grab 3 posts
    res.render('home', { 
      title: 'Home',
      isHome: true,
      bodyClass: 'is-home',
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
