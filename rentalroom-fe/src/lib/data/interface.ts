export type ProvinceInfo = {
  code: string;
  name: string;
  fullName: string;
  slug: string;
  type: "province" | "city";
  isCentral: boolean;
}

export type WardInfo = {
  code: string;
  name: string;
  fullName: string;
  slug: string;
  type: "ward" | "commune";
  provinceCode: string;
}
