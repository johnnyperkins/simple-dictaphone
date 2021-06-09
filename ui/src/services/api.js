const rootDomain = 'http://localhost:3000'
const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

/**
 * Returns a list of names for all recordings
 *
 * @returns {Promise<string>}
 */
export const getRecordingsList = async () => {
  const response = await fetch(`${rootDomain}/recordings`, {
    method: 'get',
    headers
  })

  return await response.text()
}

/**
 * Uploads a recording to object storage
 * Gets a signed url that is then used to upload the
 * recording directly to object storage
 *
 * @param {ArrayBuffer} recording
 * @param {string} name
 * @returns {Promise}
 */
export const uploadRecording = async (recording, name = '') => {
  const uploadUrlResponse = await fetch(`${rootDomain}/recordings`, {
    method: 'post',
    body: JSON.stringify({ name }),
    headers
  })

  const uploadUrl = await uploadUrlResponse.text()

  return fetch(uploadUrl, {
    method: 'PUT',
    body: recording
  })
}

/**
 * Downloads a recording by it's name.
 * Gets a signed url that is then used to download the
 * recording directly from object storage
 *
 * @param {string} recordingName
 * @returns {Promise<blob>}
 */
export const downloadRecording = async (recordingName = '') => {
  const presignedUrlResponse = await fetch(`${rootDomain}/recordings/${recordingName}`, {
    method: 'get',
    headers
  })

  const presignedUrl = await presignedUrlResponse.text()

  const blobAsString = await fetch(presignedUrl, {
    method: 'get',
    headers
  })

  return await blobAsString.blob()
}
