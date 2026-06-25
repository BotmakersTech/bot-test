export const truncateText = (
  text: string,
  limit: number
) => {

  if (text.length <= limit) return text;

  return text.slice(0, limit) + "...";
};

export const formatDate = (
  date: string
) => {

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

export const generateRobotCode = () => {

  return (
    "RBT-" +
    Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()
  );
};

export const getCategoryLabel = (
  category: string
) => {

  return category.replaceAll("_", " ");
};