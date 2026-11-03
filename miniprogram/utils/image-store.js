// 喂养记录图片本地存储（阶段 1）
// 阶段 2 接云开发后，此文件替换为 wx.cloud.uploadFile 实现，返回值结构保持不变
const DIR_NAME = 'babyfood';

// 确保用户文件目录存在
function ensureDir() {
  const fs = wx.getFileSystemManager();
  const dir = `${wx.env.USER_DATA_PATH}/${DIR_NAME}`;
  try {
    fs.accessSync(dir);
  } catch (e) {
    try {
      fs.mkdirSync(dir, true);
    } catch (err) {
      // 目录已存在或创建失败，交由调用方处理
    }
  }
  return dir;
}

// 把 chooseMedia 返回的临时图片持久化到用户目录，返回 { ok, path, error }
function saveImage(tempPath) {
  try {
    const dir = ensureDir();
    const ext = /\.png$/i.test(tempPath) ? '.png' : '.jpg';
    const target = `${dir}/${Date.now()}-${Math.floor(Math.random() * 100000)}${ext}`;
    const fs = wx.getFileSystemManager();
    fs.copyFileSync(tempPath, target);
    return { ok: true, path: target, error: null };
  } catch (e) {
    return { ok: false, path: '', error: e && e.message ? e.message : '图片保存失败' };
  }
}

// 批量保存，返回成功路径数组（失败的跳过）
function saveImages(tempPaths) {
  const saved = [];
  (tempPaths || []).forEach((p) => {
    const res = saveImage(p);
    if (res.ok) saved.push(res.path);
  });
  return saved;
}

// 删除已保存的图片文件（编辑删除图片时调用，忽略失败）
function removeImage(path) {
  if (!path || path.indexOf(wx.env.USER_DATA_PATH) !== 0) return;
  try {
    wx.getFileSystemManager().unlinkSync(path);
  } catch (e) {
    // 文件可能已不存在，忽略
  }
}

module.exports = { saveImage, saveImages, removeImage };
