const petImageModules = import.meta.glob("./assets/pets/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const petImages = Object.fromEntries(
  Object.entries(petImageModules).map(([path, image]) => {
    const fileName = path.split("/").pop();
    const key = fileName.replace(/\.(png|jpe?g|webp)$/i, "").toLowerCase();
    return [key, image];
  }),
);

export const avatarTypes = [
  { id: "dog", emoji: "\u{1F415}", name: "Dog", requiresPurchase: false },
  { id: "cat", emoji: "\u{1F408}", name: "Cat", requiresPurchase: false },
  { id: "rabbit", emoji: "\u{1F407}", name: "Rabbit", requiresPurchase: true },
  { id: "pig", emoji: "\u{1F437}", name: "Pig", requiresPurchase: true },
  { id: "bird", emoji: "\u{1F426}", name: "Bird", requiresPurchase: true },
  { id: "naruto", emoji: "\u{1F365}", name: "Naruto", requiresPurchase: true },
  { id: "pikachu", emoji: "\u{26A1}", name: "Pikachu", requiresPurchase: true },
  { id: "chiikawa", emoji: "\u{1F439}", name: "Chiikawa", requiresPurchase: true },
  { id: "lufy", emoji: "\u{1F3F4}\u{200D}\u{2620}\u{FE0F}", name: "Lufy", requiresPurchase: true },
];

export const avatarEmojis = Object.fromEntries(
  avatarTypes.map((type) => [type.id, type.emoji]),
);

const getPetImageState = (target) => {
  if (!target) return "idle";
  if (target.progress >= 100) return "celebrate";
  if (target.progress >= 70) return "happy";
  if (target.progress >= 40) return "idle";
  return "sad";
};

export const getPetImage = (avatarType = "cat", state = "idle") => {
  const type = String(avatarType || "cat").toLowerCase();
  const assetType = type === "lufy" ? "luffy" : type;
  const imageState = String(state || "idle").toLowerCase();

  return (
    petImages[`${assetType}_${imageState}`] ||
    petImages[`${assetType}_idle`] ||
    petImages[assetType] ||
    petImages[`cat_${imageState}`] ||
    petImages.cat_idle
  );
};

export const getPetImageForTarget = (target) =>
  getPetImage(target?.avatar_type, getPetImageState(target));
