// Node Deps
const fs = require('fs');
const path = require('path');
// const cwd = process.cwd();

// Base Deps
const esbuild = require('esbuild');

// Tools
const glob = require("tiny-glob");

// EsBuild Deps
const { copy } = require('esbuild-plugin-copy');

module.exports = function build(loc) {

  const source_dir = path.join(loc, 'src');

  const pkg = require(path.join(loc, "./package.json"));
  const base_external = [
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ];

  console.log(`Shared/External Dependencies (that are not going to be included on the budle) 🍲 \n`);
  console.table(base_external.map(e => ({ 'External Deps 🍲': e })));

  const LAYERS = fs.readdirSync(source_dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry => entry.name.includes('layer'))
    .map((entry) => entry.name);

  console.log(LAYERS)

  const fileName = path.join(loc, 'cdk.json');

  (async () => {

    var entryPoints = [];

    // BUILD COMMON LAYER
    const layer_name = LAYERS[0].split('.').slice(0, -1).toString();

    const common_dir = path.join(source_dir, LAYERS[0]);

    entryPoints = await Promise.all(await fs
      .readdirSync(common_dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry =>
        glob(path.join(common_dir, entry.name, '**', "*.ts"))
      )).then(e => e.reduce((prev, next) => prev.concat(next)));

    console.log(`EntryPoints for ${layer_name} Layer 🪓 \n`);
    console.table(entryPoints.map(n => ({ 'EntryPoints': n })));

    await esbuild.build({
      entryPoints: [
        path.join(common_dir, 'LambdaREST', 'index.ts'),
        ...await glob(path.join(common_dir, 'Models') + "/*.ts"),
      ],
      outdir: `dist/layers/${layer_name}/nodejs/${layer_name}`,
      outbase: common_dir,
      bundle: true,
      platform: 'node',
      sourcemap: 'inline',
      minify: true,
      external: base_external,
    }).catch(() => process.exit(1));

    const file = require(fileName);
    var routes = await getRelativeDirs('layers');
    file.context.layers = routes;

    fs.writeFile(fileName, JSON.stringify(file, null, 2), function writeJSON(err) {
      if (err) return console.log(err);
      console.log(JSON.stringify(file));
      console.log('writing to layers' + fileName);
    });

  })();

  (async () => {
    // BUILD LAMBDAS

    var entryPoints = fs.readdirSync(source_dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .filter(entry => entry.name.includes('module'))
      .map((entry) => path.join(source_dir, `/${entry.name}/handlers.ts`));

    // LOGS
    console.log(`EntryPoints for Lambdas 🪓 \n`);
    console.table(entryPoints.map(n => ({ 'EntryPoints': n })));

    await esbuild.build({
      entryPoints: entryPoints,
      outdir: 'dist',
      outbase: source_dir,
      bundle: true,
      platform: 'node',
      sourcemap: 'inline',
      minify: true,
      alias: {
        '@CommonLayer': '/opt/nodejs/common',
      },
      external: [
        ...base_external,
        './src/common.layer/*', // TODO: AUTO ADD LAYERS
        '/opt/nodejs/common/*'
      ],
    }).catch(() => process.exit(1));
  })();

  async function getRelativeDirs(id) {
    const base_dir = path.join(loc, 'dist', id);
    console.log(id + " dirs 👉🏼" + base_dir + '\n');

    var fileObjs = await fs.readdirSync(base_dir, { withFileTypes: true });
    var layers = fileObjs
      .filter(entry => entry.isDirectory())
      .map(entry => ({ name: entry.name, path: entry.name }));
    console.table(layers.map(r => ({ id: r.name })));

    return layers;
  };
}
