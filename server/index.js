const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

const Minio = require('minio')

const bucketName = 'recordings'

const minioClient = new Minio.Client({
  endPoint: 'play.min.io',
  port: 9000,
  useSSL: true,
  accessKey: 'Q3AM3UQ867SPQQA43P2F',
  secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
})

minioClient.bucketExists(bucketName, function(err, exists) {
  if (err) return console.log(err)

  if (!exists) {
    minioClient.makeBucket(bucketName, 'us-east-1', function(err) {
      if (err) return console.log('Error creating bucket with object lock.', err)
      console.log('Bucket created successfully in "us-east-1" and enabled object lock')
    })
  }
})

/**
 * Returns a pre-signed url used to upload the
 * recording directly to the object storage
 */
app.post('/recordings', (req, res) => {
  const recordingName = req.body.name
  minioClient.presignedPutObject(bucketName, recordingName, (err, presignedUrl) => {
    if (err) throw err
    res.end(presignedUrl)
  })
})

/**
 * Returns a list of names for all recordings
 */
app.get('/recordings', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  const objectsList = await new Promise((resolve, reject) => {
    const objectsListTemp = []
    const stream = minioClient.listObjectsV2(bucketName, '', true, '')

    stream.on('data', obj => objectsListTemp.push(obj.name))
    stream.on('error', reject)
    stream.on('end', () => resolve(objectsListTemp))
  })

  res.end(JSON.stringify(objectsList))
})

/**
 * Returns a pre-signed url used to download the
 * recording directly from the object storage
 */
app.get('/recordings/:name', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  const ttl = 24*60*60 // one day
  minioClient.presignedGetObject(bucketName, req.params.name, ttl, (err, presignedUrl) => {
    if (err) throw err
    res.end(presignedUrl)
  })
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
