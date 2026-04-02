import React from "react";
import { Image } from "react-native";

export const getCategoryVectorIcon = (
  slug: string | null,
  size: number = 35,
  color?: string, // We keep the prop for backwards compatibility but ignore it for images
): React.ReactNode => {
  const safeSlug = slug?.toLowerCase().trim() ?? "default";

  let imageSource;

  switch (safeSlug) {
    case "wrench":
    case "water":
    case "plomeria":
      imageSource = require("@/appASSETS/category-icons/nexofix_plomeria_128px.png");
      break;
    case "zap":
    case "flash":
    case "electricista":
    case "electricidad":
      imageSource = require("@/appASSETS/category-icons/nexofix_electricidad_128px.png");
      break;
    case "flame":
    case "gasista":
      imageSource = require("@/appASSETS/category-icons/nexofix_gasista_128px.png");
      break;
    case "key":
    case "cerrajeria":
      imageSource = require("@/appASSETS/category-icons/nexofix_cerrajeria_128px.png");
      break;
    case "broom":
    case "sparkles":
    case "limpieza":
      imageSource = require("@/appASSETS/category-icons/nexofix_limpieza_128px.png");
      break;
    case "hammer":
    case "construct":
    case "albañil":
    case "albanileria":
    case "construccion":
      imageSource = require("@/appASSETS/category-icons/nexofix_albanileria_128px.png");
      break;
    case "snowflake":
    case "climatizacion":
    case "aire":
      imageSource = require("@/appASSETS/category-icons/nexofix_climatizacion_128px.png");
      break;
    case "truck":
    case "bus":
    case "fletes":
    case "mudanzas":
      imageSource = require("@/appASSETS/category-icons/nexofix_fletes_128px.png");
      break;
    case "window":
    case "vidriero":
    case "vidrios":
      imageSource = require("@/appASSETS/category-icons/nexofix_vidriero_128px.png");
      break;
    case "color-palette":
    case "pintor":
    case "pintura":
      imageSource = require("@/appASSETS/category-icons/nexofix_pintura_128px.png");
      break;
    case "leaf":
    case "jardinero":
    case "jardineria":
      imageSource = require("@/appASSETS/category-icons/nexofix_jardineria_128px.png");
      break;
    case "techista":
    case "techos":
      imageSource = require("@/appASSETS/category-icons/nexofix_techista_128px.png");
      break;
    case "electrodomesticos":
    case "reparacion":
      imageSource = require("@/appASSETS/category-icons/nexofix_electrodomesticos_128px.png");
      break;
    case "fumigacion":
    case "plagas":
      imageSource = require("@/appASSETS/category-icons/nexofix_fumigacion_128px.png");
      break;
    default:
      // Fallback
      imageSource = require("@/appASSETS/category-icons/nexofix_albanileria_128px.png");
      break;
  }

  return (
    <Image source={imageSource} style={{ width: size, height: size, resizeMode: "contain" }} />
  );
};
