import {
  ServiceTemplate,
  ServiceTemplateDTO,
} from "../Type/InstantProfessionalType";

export const ServiceTemplateMapper = {
  toDomain(dto: ServiceTemplateDTO): ServiceTemplate {
    return {
      id: dto.id,
      label: dto.label,
      basePrice: Number(dto.base_price_suggested),
      isUrgent: dto.is_urgent_template,
      description: dto.description || "",
    };
  },
};
