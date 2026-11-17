export async function chooseProfilePhoto() {
  const picker = await import("expo-image-picker");
  const result = await picker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const { ImageManipulator, SaveFormat } =
    await import("expo-image-manipulator");
  const context = ImageManipulator.manipulate(asset.uri);
  const side = Math.min(asset.width, asset.height);
  context.crop({
    originX: Math.floor((asset.width - side) / 2),
    originY: Math.floor((asset.height - side) / 2),
    width: side,
    height: side,
  });
  context.resize({ width: 400, height: 400 });
  const rendered = await context.renderAsync();
  try {
    const image = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.7,
      base64: true,
    });
    if (!image.base64 || image.base64.length > 273064)
      throw new Error("A foto ficou muito grande. Escolha outra imagem.");
    return `data:image/jpeg;base64,${image.base64}`;
  } finally {
    rendered.release();
    context.release();
  }
}
