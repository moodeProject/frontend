const STORAGE_KEY =
  'safeon-worker-profile-images-v1';

function text(value) {
  return value === undefined ||
    value === null
    ? ''
    : String(value).trim();
}

function readStore() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        ) || '{}'
      );

    return parsed &&
      typeof parsed === 'object'
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store)
  );
}

export function getWorkerImageKey(
  worker
) {
  return (
    text(
      worker?.id ??
        worker?.workerId
    ) ||
    text(
      worker?.employeeNumber ??
        worker?.employeeNo ??
        worker?.workerCode
    ) ||
    text(
      worker?.loginId
    ) ||
    text(
      worker?.name
    )
  );
}

export function getSavedWorkerProfileImage(
  worker
) {
  const key =
    getWorkerImageKey(
      worker
    );

  if (!key) return '';

  return (
    readStore()[key] || ''
  );
}

export function saveWorkerProfileImage(
  worker,
  profileImage
) {
  const key =
    getWorkerImageKey(
      worker
    );

  if (!key) {
    throw new Error(
      '작업자 식별 정보를 찾을 수 없어 이미지를 저장할 수 없습니다.'
    );
  }

  const store =
    readStore();

  store[key] =
    profileImage;

  writeStore(store);

  window.dispatchEvent(
    new CustomEvent(
      'safeon-worker-profile-image-updated',
      {
        detail: {
          key,
          profileImage,
        },
      }
    )
  );

  return profileImage;
}

export function applySavedWorkerProfileImage(
  worker
) {
  if (!worker) return worker;

  const saved =
    getSavedWorkerProfileImage(
      worker
    );

  if (!saved) {
    return worker;
  }

  return {
    ...worker,
    profileImage: saved,
  };
}

function loadImage(dataUrl) {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      image.onload =
        () => resolve(image);

      image.onerror =
        reject;

      image.src =
        dataUrl;
    }
  );
}

function readFileAsDataUrl(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

/**
 * localStorage 용량 초과를 막기 위해
 * 프로필 이미지를 최대 512px로 축소하고
 * JPEG로 압축해서 저장합니다.
 */
export async function optimizeProfileImageFile(
  file
) {
  const original =
    await readFileAsDataUrl(
      file
    );

  const image =
    await loadImage(
      original
    );

  const maxSize = 512;
  const scale =
    Math.min(
      1,
      maxSize /
        Math.max(
          image.width,
          image.height
        )
    );

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          scale
      )
    );

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          scale
      )
    );

  const canvas =
    document.createElement(
      'canvas'
    );

  canvas.width = width;
  canvas.height = height;

  const ctx =
    canvas.getContext(
      '2d'
    );

  ctx.fillStyle =
    '#ffffff';

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  return canvas.toDataURL(
    'image/jpeg',
    0.82
  );
}
