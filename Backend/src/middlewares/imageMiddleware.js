import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Busboy = require('busboy');

const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageMiddleware = {
  any: () => {
    return (req, res, next) => {
      if (req.method !== 'POST' && req.method !== 'PUT') {
        return next();
      }
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return next();
      }

      let busboy;
      try {
        busboy = Busboy({ headers: req.headers });
      } catch (err) {
        return next(err);
      }

      const fields = {};
      const files = [];
      const writePromises = [];

      busboy.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(filename);
        const saveFilename = fieldname + '-' + uniqueSuffix + ext;
        const savePath = path.join(uploadDir, saveFilename);

        const fileData = {
          fieldname,
          originalname: filename,
          encoding,
          mimetype: mimeType,
          destination: 'uploads/',
          filename: saveFilename,
          path: savePath,
          size: 0
        };

        const writeStream = fs.createWriteStream(savePath);
        
        const promise = new Promise((resolve, reject) => {
          file.on('data', (data) => {
            fileData.size += data.length;
          });
          file.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
        writePromises.push(promise);
        files.push(fileData);
      });

      busboy.on('field', (fieldname, val) => {
        fields[fieldname] = val;
      });

      busboy.on('finish', async () => {
        try {
          await Promise.all(writePromises);
          req.body = fields;
          req.uploadedFiles = files;
          req.uploadedFile = files[0] || undefined;
          next();
        } catch (err) {
          next(err);
        }
      });

      busboy.on('error', (err) => {
        next(err);
      });

      req.pipe(busboy);
    };
  }
};

export default imageMiddleware;
