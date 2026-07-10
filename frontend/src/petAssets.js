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
  { id: "lion", emoji: "\u{1F981}", name: "Lion", requiresPurchase: true },
  { id: "giraffe", emoji: "\u{1F992}", name: "Giraffe", requiresPurchase: true },
  { id: "panda", emoji: "\u{1F43C}", name: "Panda", requiresPurchase: true },
  { id: "fox", emoji: "\u{1F98A}", name: "Fox", requiresPurchase: true },
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
  const imageState = String(state || "idle").toLowerCase();

  return (
    petImages[`${type}_${imageState}`] ||
    petImages[`${type}_idle`] ||
    petImages[type] ||
    petImages[`cat_${imageState}`] ||
    petImages.cat_idle
  );
};

export const getPetImageForTarget = (target) =>
  getPetImage(target?.avatar_type, getPetImageState(target));
