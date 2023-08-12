import * as path from "path";
import * as child from 'child_process';
import * as fs from "fs";

export async function getDirs(id: string) {
  const base_dir = path.join(__dirname, '../', 'dist', id);
  console.log(id + " dirs 👉🏼" + base_dir + '\n');

  var fileObjs = await fs.readdirSync(base_dir, { withFileTypes: true });
  var layers = fileObjs
    .filter(entry => entry.isDirectory())
    .map(entry => ({ name: entry.name, path: path.join(base_dir, entry.name) }));
  console.table(layers.map(r => ({ id: r.name })));

  return layers;
};

export function getStackname(name: string) {
  if (process.env.DEPLOYMENT_ENV === undefined) return name;
  return `${name}-${process.env.DEPLOYMENT_ENV}`
};

export async function getCurrentBranch(): Promise<string> {
  return new Promise(function (resolve, reject) {
    child.exec('git rev-parse --abbrev-ref HEAD', (err, stdout, stderr) => {
      if (err) { reject(err); }

      if (typeof stdout === 'string') {
        resolve(stdout.trim());
        console.log(`The branch is ${stdout.trim()}`);
      }
    });
  });
}

