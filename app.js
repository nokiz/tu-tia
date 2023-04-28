// Translated from Python to Javascript by ChatGPT.
// Source: https://colab.research.google.com/drive/1v45UprB-fzSeWk4wTnYJEx4dEeW2DnYw
// Source: https://hackernoon.com/instagram-is-dead-heres-why
// Source: https://guides.tryleap.ai/guides/stellar-prompts-for-ai-avatars

const axios = require("axios");
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.API_KEY;

const HEADERS = {
  accept: "application/json",
  "content-type": "application/json",
  authorization: `Bearer ${API_KEY}`,
};

const IMAGES = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
];

// Let's create a custom model so we can fine tune it.
const modelId = createModel("Sample");

// We now upload the images to fine tune this model.
uploadImageSamples(modelId, IMAGES);

/* Now it's time to fine tune the model. Notice how I'm continuously 
getting the status of the training job and waiting until it's 
finished before moving on. */
let versionId, status1;

queueTrainingJob(modelId)
  .then((response) => {
    versionId = response.versionId;
    status1 = response.status;

    while (status1 !== "finished") {
      setTimeout(async () => {
        const modelVersionResponse = await getModelVersion(
          modelId,
          versionId
        );
        versionId = modelVersionResponse.versionId;
        status1 = modelVersionResponse.status;
      }, 10000);
    }
  })
  .catch((error) => {
    console.error(error);
  });

/* Now that we have a fine-tuned version of a model, we can
generate images using it. Notice how I'm using '@me' to 
indicate I want pictures similar to the ones we upload to 
fine tune this model. */
let inferenceId, status2, image;

generateImage(
  modelId,
  "Detailed portrait of @me, futuristic sci-fi style, low-emission-neon, bladerunner movie scene style"
)
  .then((response) => {
    inferenceId = response.inferenceId;
    status2 = response.status;

    while (status2 !== "finished") {
      setTimeout(async () => {
        const inferenceJobResponse = await getInferenceJob(
          modelId,
          inferenceId
        );
        inferenceId = inferenceJobResponse.inferenceId;
        status2 = inferenceJobResponse.status;
        image = inferenceJobResponse.image;
      }, 10000);
    }

    console.log(image);
  })
  .catch((error) => {
    console.error(error);
  });

// ****************************** FUNCTIONS ******************************

function createModel(title) {
  const url = "https://api.tryleap.ai/api/v1/images/models";

  const payload = {
    title: title,
    subjectKeyword: "@me",
  };

  return axios
    .post(url, payload, { headers: HEADERS })
    .then((response) => {
      const modelId = response.data.id;
      return modelId;
    })
    .catch((error) => {
      console.error(error);
    });
}

async function uploadImageSamples(modelId) {
  const resolvedModelId = await modelId;
  const url = `https://api.tryleap.ai/api/v1/images/models/${resolvedModelId}/samples/url`;

  const payload = { images: IMAGES };

  return axios
    .post(url, payload, { headers: HEADERS })
    .then((response) => {
      // Hacer algo con la respuesta, si es necesario
    })
    .catch((error) => {
      console.error(error);
    });
}

async function queueTrainingJob(modelId) {
  const resolvedModelId = await modelId;
  const url = `https://api.tryleap.ai/api/v1/images/models/${resolvedModelId}/queue`;

  return axios
    .post(url, null, { headers: HEADERS })
    .then((response) => {
      const data = response.data;

      console.log(JSON.stringify(data));

      const versionId = data.id;
      const status = data.status;

      console.log(`Version ID: ${versionId}. Status: ${status}`);

      return { versionId, status };
    })
    .catch((error) => {
      console.error(error);
    });
}

async function getModelVersion(modelId, versionId) {
  const resolvedModelId = await modelId;
  const resolvedVersionId = await versionId;
  const url = `https://api.tryleap.ai/api/v1/images/models/${resolvedModelId}/versions/${resolvedVersionId}`;

  return axios
    .get(url, { headers: HEADERS })
    .then((response) => {
      const data = response.data;

      const resolvedVersionId = data.id;
      const status = data.status;

      console.log(`Version ID: ${resolvedVersionId}. Status: ${status}`);

      return { resolvedVersionId, status };
    })
    .catch((error) => {
      console.error(error);
    });
}

async function generateImage(modelId, prompt) {
  const resolvedModelId = await modelId;
  const url = `https://api.tryleap.ai/api/v1/images/models/${resolvedModelId}/inferences`;

  const payload = {
    prompt: prompt,
    steps: 50,
    width: 512,
    height: 512,
    numberOfImages: 1,
    seed: 4523184,
  };

  return axios
    .post(url, payload, { headers: HEADERS })
    .then((response) => {
      const data = response.data;

      const inferenceId = data.id;
      const status = data.status;

      console.log(`Inference ID: ${inferenceId}. Status: ${status}`);

      return { inferenceId, status };
    })
    .catch((error) => {
      console.error(error);
    });
}

async function getInferenceJob(modelId, inferenceId) {
  const resolvedModelId = await modelId;
  const resolvedInferenceId = await inferenceId;
  const url = `https://api.tryleap.ai/api/v1/images/models/${resolvedModelId}/inferences/${resolvedInferenceId}`;

  return axios
    .get(url, { headers: HEADERS })
    .then((response) => {
      const data = response.data;

      const resolvedInferenceId = data.id;
      const state = data.state;
      let image = null;

      if (data.images.length > 0) {
        image = data.images[0].uri;
      }

      console.log(`Inference ID: ${resolvedInferenceId}. State: ${state}`);

      return { resolvedInferenceId, state, image };
    })
    .catch((error) => {
      console.error(error);
    });
}
