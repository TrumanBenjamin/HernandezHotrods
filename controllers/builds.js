// controllers/builds.js
exports.show = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const build = await db.one(/* select by slug */);
    const { blocks, extraPhotos } = await getBuildPageData(build.id);

    // choose the template per is_completed
    const view = build.is_completed ? 'builds/show' : 'builds/show-current';

    res.render(view, { title: build.name, build, blocks, extraPhotos });
  } catch (err) {
    next(err);
  }
};
