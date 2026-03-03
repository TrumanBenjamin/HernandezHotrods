const fs = require("fs");
const path = require("path");

exports.shorthands = undefined;

exports.up = (pgm) => {
  // baseline migration - schema was loaded via psql
};

exports.down = (pgm) => {
  // optional: leave empty for baseline
};