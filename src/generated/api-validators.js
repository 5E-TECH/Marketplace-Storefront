// Generated from contract/openapi.json. Do not edit.
"use strict";
export const validateStorefrontProductDto = validate11;
const schema12 = {"type":"object","properties":{"id":{"type":"string"},"shopId":{"type":"string"},"ownerUserId":{"type":"string"},"categoryId":{},"name":{"type":"string"},"slug":{"type":"string"},"description":{},"price":{"type":"number"},"oldPrice":{},"imageUrl":{},"images":{"type":"array","items":{"type":"string"}},"attributes":{},"hasVariants":{"type":"boolean"},"status":{"type":"string","enum":["DRAFT","ACTIVE","ARCHIVED","OUT_OF_STOCK"]},"isBlocked":{"type":"boolean"},"rating":{"type":"number"},"createdAt":{"format":"date-time","type":"string"},"updatedAt":{"format":"date-time","type":"string"},"shop":{"description":"Product qaysi marketga tegishli ekanini bildiradi","allOf":[{"$ref":"#/components/schemas/SellerShopDto"}]},"category":{"anyOf":[{"allOf":[{"$ref":"#/components/schemas/StorefrontCategoryDto"}]},{"type":"null"}]},"variants":{"type":"array","items":{"$ref":"#/components/schemas/ProductVariantDto"}}},"required":["id","shopId","ownerUserId","categoryId","name","slug","description","price","oldPrice","imageUrl","images","attributes","hasVariants","status","isBlocked","rating","createdAt","updatedAt","shop","category","variants"]};
const schema13 = {"type":"object","properties":{"id":{"type":"string"},"ownerUserId":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"status":{"type":"string","enum":["PENDING","ACTIVE","SUSPENDED","REJECTED"]},"description":{},"logoUrl":{"anyOf":[{"type":"string"},{"type":"null"}]},"bannerUrl":{"anyOf":[{"type":"string"},{"type":"null"}]},"phone":{},"regionId":{},"districtId":{},"address":{},"rating":{"type":"number"},"ordersCount":{"type":"number"}},"required":["id","ownerUserId","name","slug","status","description","logoUrl","bannerUrl","phone","regionId","districtId","address","rating","ordersCount"]};
const schema14 = {"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"parentId":{},"iconUrl":{}},"required":["id","name","slug","parentId","iconUrl"]};
const schema15 = {"type":"object","properties":{"id":{"type":"string"},"productId":{"type":"string"},"sku":{"type":"string"},"name":{},"attributes":{},"price":{},"oldPrice":{},"barcode":{},"imageUrl":{},"isActive":{"type":"boolean"}},"required":["id","productId","sku","name","attributes","price","oldPrice","barcode","imageUrl","isActive"]};

function validate11(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((((((((((((((((((data.id === undefined) && (missing0 = "id")) || ((data.shopId === undefined) && (missing0 = "shopId"))) || ((data.ownerUserId === undefined) && (missing0 = "ownerUserId"))) || ((data.categoryId === undefined) && (missing0 = "categoryId"))) || ((data.name === undefined) && (missing0 = "name"))) || ((data.slug === undefined) && (missing0 = "slug"))) || ((data.description === undefined) && (missing0 = "description"))) || ((data.price === undefined) && (missing0 = "price"))) || ((data.oldPrice === undefined) && (missing0 = "oldPrice"))) || ((data.imageUrl === undefined) && (missing0 = "imageUrl"))) || ((data.images === undefined) && (missing0 = "images"))) || ((data.attributes === undefined) && (missing0 = "attributes"))) || ((data.hasVariants === undefined) && (missing0 = "hasVariants"))) || ((data.status === undefined) && (missing0 = "status"))) || ((data.isBlocked === undefined) && (missing0 = "isBlocked"))) || ((data.rating === undefined) && (missing0 = "rating"))) || ((data.createdAt === undefined) && (missing0 = "createdAt"))) || ((data.updatedAt === undefined) && (missing0 = "updatedAt"))) || ((data.shop === undefined) && (missing0 = "shop"))) || ((data.category === undefined) && (missing0 = "category"))) || ((data.variants === undefined) && (missing0 = "variants"))){
validate11.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.id !== undefined){
const _errs1 = errors;
if(typeof data.id !== "string"){
validate11.errors = [{instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.shopId !== undefined){
const _errs3 = errors;
if(typeof data.shopId !== "string"){
validate11.errors = [{instancePath:instancePath+"/shopId",schemaPath:"#/properties/shopId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.ownerUserId !== undefined){
const _errs5 = errors;
if(typeof data.ownerUserId !== "string"){
validate11.errors = [{instancePath:instancePath+"/ownerUserId",schemaPath:"#/properties/ownerUserId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.name !== undefined){
const _errs7 = errors;
if(typeof data.name !== "string"){
validate11.errors = [{instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.slug !== undefined){
const _errs9 = errors;
if(typeof data.slug !== "string"){
validate11.errors = [{instancePath:instancePath+"/slug",schemaPath:"#/properties/slug/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs9 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.price !== undefined){
const _errs11 = errors;
if(!(typeof data.price == "number")){
validate11.errors = [{instancePath:instancePath+"/price",schemaPath:"#/properties/price/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs11 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.images !== undefined){
let data6 = data.images;
const _errs13 = errors;
if(errors === _errs13){
if(Array.isArray(data6)){
var valid1 = true;
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
const _errs15 = errors;
if(typeof data6[i0] !== "string"){
validate11.errors = [{instancePath:instancePath+"/images/" + i0,schemaPath:"#/properties/images/items/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid1 = _errs15 === errors;
if(!valid1){
break;
}
}
}
else {
validate11.errors = [{instancePath:instancePath+"/images",schemaPath:"#/properties/images/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs13 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.hasVariants !== undefined){
const _errs17 = errors;
if(typeof data.hasVariants !== "boolean"){
validate11.errors = [{instancePath:instancePath+"/hasVariants",schemaPath:"#/properties/hasVariants/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid0 = _errs17 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.status !== undefined){
let data9 = data.status;
const _errs19 = errors;
if(typeof data9 !== "string"){
validate11.errors = [{instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
if(!((((data9 === "DRAFT") || (data9 === "ACTIVE")) || (data9 === "ARCHIVED")) || (data9 === "OUT_OF_STOCK"))){
validate11.errors = [{instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema12.properties.status.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs19 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.isBlocked !== undefined){
const _errs21 = errors;
if(typeof data.isBlocked !== "boolean"){
validate11.errors = [{instancePath:instancePath+"/isBlocked",schemaPath:"#/properties/isBlocked/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid0 = _errs21 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.rating !== undefined){
const _errs23 = errors;
if(!(typeof data.rating == "number")){
validate11.errors = [{instancePath:instancePath+"/rating",schemaPath:"#/properties/rating/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs23 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.createdAt !== undefined){
const _errs25 = errors;
if(errors === _errs25){
if(errors === _errs25){
if(!(typeof data.createdAt === "string")){
validate11.errors = [{instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs25 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.updatedAt !== undefined){
const _errs27 = errors;
if(errors === _errs27){
if(errors === _errs27){
if(!(typeof data.updatedAt === "string")){
validate11.errors = [{instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs27 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.shop !== undefined){
let data14 = data.shop;
const _errs29 = errors;
const _errs31 = errors;
if(errors === _errs31){
if(data14 && typeof data14 == "object" && !Array.isArray(data14)){
let missing1;
if(((((((((((((((data14.id === undefined) && (missing1 = "id")) || ((data14.ownerUserId === undefined) && (missing1 = "ownerUserId"))) || ((data14.name === undefined) && (missing1 = "name"))) || ((data14.slug === undefined) && (missing1 = "slug"))) || ((data14.status === undefined) && (missing1 = "status"))) || ((data14.description === undefined) && (missing1 = "description"))) || ((data14.logoUrl === undefined) && (missing1 = "logoUrl"))) || ((data14.bannerUrl === undefined) && (missing1 = "bannerUrl"))) || ((data14.phone === undefined) && (missing1 = "phone"))) || ((data14.regionId === undefined) && (missing1 = "regionId"))) || ((data14.districtId === undefined) && (missing1 = "districtId"))) || ((data14.address === undefined) && (missing1 = "address"))) || ((data14.rating === undefined) && (missing1 = "rating"))) || ((data14.ordersCount === undefined) && (missing1 = "ordersCount"))){
validate11.errors = [{instancePath:instancePath+"/shop",schemaPath:"#/components/schemas/SellerShopDto/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
if(data14.id !== undefined){
const _errs33 = errors;
if(typeof data14.id !== "string"){
validate11.errors = [{instancePath:instancePath+"/shop/id",schemaPath:"#/components/schemas/SellerShopDto/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid4 = _errs33 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.ownerUserId !== undefined){
const _errs35 = errors;
if(typeof data14.ownerUserId !== "string"){
validate11.errors = [{instancePath:instancePath+"/shop/ownerUserId",schemaPath:"#/components/schemas/SellerShopDto/properties/ownerUserId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid4 = _errs35 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.name !== undefined){
const _errs37 = errors;
if(typeof data14.name !== "string"){
validate11.errors = [{instancePath:instancePath+"/shop/name",schemaPath:"#/components/schemas/SellerShopDto/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid4 = _errs37 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.slug !== undefined){
const _errs39 = errors;
if(typeof data14.slug !== "string"){
validate11.errors = [{instancePath:instancePath+"/shop/slug",schemaPath:"#/components/schemas/SellerShopDto/properties/slug/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid4 = _errs39 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.status !== undefined){
let data19 = data14.status;
const _errs41 = errors;
if(typeof data19 !== "string"){
validate11.errors = [{instancePath:instancePath+"/shop/status",schemaPath:"#/components/schemas/SellerShopDto/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
if(!((((data19 === "PENDING") || (data19 === "ACTIVE")) || (data19 === "SUSPENDED")) || (data19 === "REJECTED"))){
validate11.errors = [{instancePath:instancePath+"/shop/status",schemaPath:"#/components/schemas/SellerShopDto/properties/status/enum",keyword:"enum",params:{allowedValues: schema13.properties.status.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid4 = _errs41 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.logoUrl !== undefined){
let data20 = data14.logoUrl;
const _errs43 = errors;
const _errs44 = errors;
let valid5 = false;
const _errs45 = errors;
if(typeof data20 !== "string"){
const err0 = {instancePath:instancePath+"/shop/logoUrl",schemaPath:"#/components/schemas/SellerShopDto/properties/logoUrl/anyOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
var _valid0 = _errs45 === errors;
valid5 = valid5 || _valid0;
if(!valid5){
const _errs47 = errors;
if(data20 !== null){
const err1 = {instancePath:instancePath+"/shop/logoUrl",schemaPath:"#/components/schemas/SellerShopDto/properties/logoUrl/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
var _valid0 = _errs47 === errors;
valid5 = valid5 || _valid0;
}
if(!valid5){
const err2 = {instancePath:instancePath+"/shop/logoUrl",schemaPath:"#/components/schemas/SellerShopDto/properties/logoUrl/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
validate11.errors = vErrors;
return false;
}
else {
errors = _errs44;
if(vErrors !== null){
if(_errs44){
vErrors.length = _errs44;
}
else {
vErrors = null;
}
}
}
var valid4 = _errs43 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.bannerUrl !== undefined){
let data21 = data14.bannerUrl;
const _errs49 = errors;
const _errs50 = errors;
let valid6 = false;
const _errs51 = errors;
if(typeof data21 !== "string"){
const err3 = {instancePath:instancePath+"/shop/bannerUrl",schemaPath:"#/components/schemas/SellerShopDto/properties/bannerUrl/anyOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
var _valid1 = _errs51 === errors;
valid6 = valid6 || _valid1;
if(!valid6){
const _errs53 = errors;
if(data21 !== null){
const err4 = {instancePath:instancePath+"/shop/bannerUrl",schemaPath:"#/components/schemas/SellerShopDto/properties/bannerUrl/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid1 = _errs53 === errors;
valid6 = valid6 || _valid1;
}
if(!valid6){
const err5 = {instancePath:instancePath+"/shop/bannerUrl",schemaPath:"#/components/schemas/SellerShopDto/properties/bannerUrl/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
validate11.errors = vErrors;
return false;
}
else {
errors = _errs50;
if(vErrors !== null){
if(_errs50){
vErrors.length = _errs50;
}
else {
vErrors = null;
}
}
}
var valid4 = _errs49 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.rating !== undefined){
const _errs55 = errors;
if(!(typeof data14.rating == "number")){
validate11.errors = [{instancePath:instancePath+"/shop/rating",schemaPath:"#/components/schemas/SellerShopDto/properties/rating/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid4 = _errs55 === errors;
}
else {
var valid4 = true;
}
if(valid4){
if(data14.ordersCount !== undefined){
const _errs57 = errors;
if(!(typeof data14.ordersCount == "number")){
validate11.errors = [{instancePath:instancePath+"/shop/ordersCount",schemaPath:"#/components/schemas/SellerShopDto/properties/ordersCount/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid4 = _errs57 === errors;
}
else {
var valid4 = true;
}
}
}
}
}
}
}
}
}
}
}
else {
validate11.errors = [{instancePath:instancePath+"/shop",schemaPath:"#/components/schemas/SellerShopDto/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid0 = _errs29 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.category !== undefined){
let data24 = data.category;
const _errs59 = errors;
const _errs60 = errors;
let valid7 = false;
const _errs61 = errors;
const _errs63 = errors;
if(errors === _errs63){
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
let missing2;
if((((((data24.id === undefined) && (missing2 = "id")) || ((data24.name === undefined) && (missing2 = "name"))) || ((data24.slug === undefined) && (missing2 = "slug"))) || ((data24.parentId === undefined) && (missing2 = "parentId"))) || ((data24.iconUrl === undefined) && (missing2 = "iconUrl"))){
const err6 = {instancePath:instancePath+"/category",schemaPath:"#/components/schemas/StorefrontCategoryDto/required",keyword:"required",params:{missingProperty: missing2},message:"must have required property '"+missing2+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
if(data24.id !== undefined){
const _errs65 = errors;
if(typeof data24.id !== "string"){
const err7 = {instancePath:instancePath+"/category/id",schemaPath:"#/components/schemas/StorefrontCategoryDto/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var valid10 = _errs65 === errors;
}
else {
var valid10 = true;
}
if(valid10){
if(data24.name !== undefined){
const _errs67 = errors;
if(typeof data24.name !== "string"){
const err8 = {instancePath:instancePath+"/category/name",schemaPath:"#/components/schemas/StorefrontCategoryDto/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
var valid10 = _errs67 === errors;
}
else {
var valid10 = true;
}
if(valid10){
if(data24.slug !== undefined){
const _errs69 = errors;
if(typeof data24.slug !== "string"){
const err9 = {instancePath:instancePath+"/category/slug",schemaPath:"#/components/schemas/StorefrontCategoryDto/properties/slug/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var valid10 = _errs69 === errors;
}
else {
var valid10 = true;
}
}
}
}
}
else {
const err10 = {instancePath:instancePath+"/category",schemaPath:"#/components/schemas/StorefrontCategoryDto/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
var _valid2 = _errs61 === errors;
valid7 = valid7 || _valid2;
if(!valid7){
const _errs71 = errors;
if(data24 !== null){
const err11 = {instancePath:instancePath+"/category",schemaPath:"#/properties/category/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid2 = _errs71 === errors;
valid7 = valid7 || _valid2;
}
if(!valid7){
const err12 = {instancePath:instancePath+"/category",schemaPath:"#/properties/category/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
validate11.errors = vErrors;
return false;
}
else {
errors = _errs60;
if(vErrors !== null){
if(_errs60){
vErrors.length = _errs60;
}
else {
vErrors = null;
}
}
}
var valid0 = _errs59 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.variants !== undefined){
let data28 = data.variants;
const _errs73 = errors;
if(errors === _errs73){
if(Array.isArray(data28)){
var valid11 = true;
const len1 = data28.length;
for(let i1=0; i1<len1; i1++){
let data29 = data28[i1];
const _errs75 = errors;
const _errs76 = errors;
if(errors === _errs76){
if(data29 && typeof data29 == "object" && !Array.isArray(data29)){
let missing3;
if(((((((((((data29.id === undefined) && (missing3 = "id")) || ((data29.productId === undefined) && (missing3 = "productId"))) || ((data29.sku === undefined) && (missing3 = "sku"))) || ((data29.name === undefined) && (missing3 = "name"))) || ((data29.attributes === undefined) && (missing3 = "attributes"))) || ((data29.price === undefined) && (missing3 = "price"))) || ((data29.oldPrice === undefined) && (missing3 = "oldPrice"))) || ((data29.barcode === undefined) && (missing3 = "barcode"))) || ((data29.imageUrl === undefined) && (missing3 = "imageUrl"))) || ((data29.isActive === undefined) && (missing3 = "isActive"))){
validate11.errors = [{instancePath:instancePath+"/variants/" + i1,schemaPath:"#/components/schemas/ProductVariantDto/required",keyword:"required",params:{missingProperty: missing3},message:"must have required property '"+missing3+"'"}];
return false;
}
else {
if(data29.id !== undefined){
const _errs78 = errors;
if(typeof data29.id !== "string"){
validate11.errors = [{instancePath:instancePath+"/variants/" + i1+"/id",schemaPath:"#/components/schemas/ProductVariantDto/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid13 = _errs78 === errors;
}
else {
var valid13 = true;
}
if(valid13){
if(data29.productId !== undefined){
const _errs80 = errors;
if(typeof data29.productId !== "string"){
validate11.errors = [{instancePath:instancePath+"/variants/" + i1+"/productId",schemaPath:"#/components/schemas/ProductVariantDto/properties/productId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid13 = _errs80 === errors;
}
else {
var valid13 = true;
}
if(valid13){
if(data29.sku !== undefined){
const _errs82 = errors;
if(typeof data29.sku !== "string"){
validate11.errors = [{instancePath:instancePath+"/variants/" + i1+"/sku",schemaPath:"#/components/schemas/ProductVariantDto/properties/sku/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid13 = _errs82 === errors;
}
else {
var valid13 = true;
}
if(valid13){
if(data29.isActive !== undefined){
const _errs84 = errors;
if(typeof data29.isActive !== "boolean"){
validate11.errors = [{instancePath:instancePath+"/variants/" + i1+"/isActive",schemaPath:"#/components/schemas/ProductVariantDto/properties/isActive/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid13 = _errs84 === errors;
}
else {
var valid13 = true;
}
}
}
}
}
}
else {
validate11.errors = [{instancePath:instancePath+"/variants/" + i1,schemaPath:"#/components/schemas/ProductVariantDto/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid11 = _errs75 === errors;
if(!valid11){
break;
}
}
}
else {
validate11.errors = [{instancePath:instancePath+"/variants",schemaPath:"#/properties/variants/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs73 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
else {
validate11.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate11.errors = vErrors;
return errors === 0;
}

export const validateStorefrontProductsPageDto = validate12;
const schema16 = {"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/StorefrontProductDto"}},"total":{"type":"number"},"page":{"type":"number"},"limit":{"type":"number"},"totalPages":{"type":"number"}},"required":["items","total","page","limit","totalPages"]};

function validate12(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.items === undefined) && (missing0 = "items")) || ((data.total === undefined) && (missing0 = "total"))) || ((data.page === undefined) && (missing0 = "page"))) || ((data.limit === undefined) && (missing0 = "limit"))) || ((data.totalPages === undefined) && (missing0 = "totalPages"))){
validate12.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.items !== undefined){
let data0 = data.items;
const _errs1 = errors;
if(errors === _errs1){
if(Array.isArray(data0)){
var valid1 = true;
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
const _errs3 = errors;
if(!(validate11(data0[i0], {instancePath:instancePath+"/items/" + i0,parentData:data0,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate11.errors : vErrors.concat(validate11.errors);
errors = vErrors.length;
}
var valid1 = _errs3 === errors;
if(!valid1){
break;
}
}
}
else {
validate12.errors = [{instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.total !== undefined){
const _errs4 = errors;
if(!(typeof data.total == "number")){
validate12.errors = [{instancePath:instancePath+"/total",schemaPath:"#/properties/total/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.page !== undefined){
const _errs6 = errors;
if(!(typeof data.page == "number")){
validate12.errors = [{instancePath:instancePath+"/page",schemaPath:"#/properties/page/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.limit !== undefined){
const _errs8 = errors;
if(!(typeof data.limit == "number")){
validate12.errors = [{instancePath:instancePath+"/limit",schemaPath:"#/properties/limit/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.totalPages !== undefined){
const _errs10 = errors;
if(!(typeof data.totalPages == "number")){
validate12.errors = [{instancePath:instancePath+"/totalPages",schemaPath:"#/properties/totalPages/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs10 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
else {
validate12.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate12.errors = vErrors;
return errors === 0;
}

export const validateProductDto = validate14;
const schema17 = {"type":"object","properties":{"id":{"type":"string"},"shopId":{"type":"string"},"ownerUserId":{"type":"string"},"categoryId":{},"name":{"type":"string"},"slug":{"type":"string"},"description":{},"price":{"type":"number"},"oldPrice":{},"imageUrl":{},"images":{"type":"array","items":{"type":"string"}},"attributes":{},"hasVariants":{"type":"boolean"},"status":{"type":"string","enum":["DRAFT","ACTIVE","ARCHIVED","OUT_OF_STOCK"]},"isBlocked":{"type":"boolean"},"rating":{"type":"number"},"createdAt":{"format":"date-time","type":"string"},"updatedAt":{"format":"date-time","type":"string"}},"required":["id","shopId","ownerUserId","categoryId","name","slug","description","price","oldPrice","imageUrl","images","attributes","hasVariants","status","isBlocked","rating","createdAt","updatedAt"]};

function validate14(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((((((((((((((data.id === undefined) && (missing0 = "id")) || ((data.shopId === undefined) && (missing0 = "shopId"))) || ((data.ownerUserId === undefined) && (missing0 = "ownerUserId"))) || ((data.categoryId === undefined) && (missing0 = "categoryId"))) || ((data.name === undefined) && (missing0 = "name"))) || ((data.slug === undefined) && (missing0 = "slug"))) || ((data.description === undefined) && (missing0 = "description"))) || ((data.price === undefined) && (missing0 = "price"))) || ((data.oldPrice === undefined) && (missing0 = "oldPrice"))) || ((data.imageUrl === undefined) && (missing0 = "imageUrl"))) || ((data.images === undefined) && (missing0 = "images"))) || ((data.attributes === undefined) && (missing0 = "attributes"))) || ((data.hasVariants === undefined) && (missing0 = "hasVariants"))) || ((data.status === undefined) && (missing0 = "status"))) || ((data.isBlocked === undefined) && (missing0 = "isBlocked"))) || ((data.rating === undefined) && (missing0 = "rating"))) || ((data.createdAt === undefined) && (missing0 = "createdAt"))) || ((data.updatedAt === undefined) && (missing0 = "updatedAt"))){
validate14.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.id !== undefined){
const _errs1 = errors;
if(typeof data.id !== "string"){
validate14.errors = [{instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.shopId !== undefined){
const _errs3 = errors;
if(typeof data.shopId !== "string"){
validate14.errors = [{instancePath:instancePath+"/shopId",schemaPath:"#/properties/shopId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.ownerUserId !== undefined){
const _errs5 = errors;
if(typeof data.ownerUserId !== "string"){
validate14.errors = [{instancePath:instancePath+"/ownerUserId",schemaPath:"#/properties/ownerUserId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.name !== undefined){
const _errs7 = errors;
if(typeof data.name !== "string"){
validate14.errors = [{instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.slug !== undefined){
const _errs9 = errors;
if(typeof data.slug !== "string"){
validate14.errors = [{instancePath:instancePath+"/slug",schemaPath:"#/properties/slug/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs9 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.price !== undefined){
const _errs11 = errors;
if(!(typeof data.price == "number")){
validate14.errors = [{instancePath:instancePath+"/price",schemaPath:"#/properties/price/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs11 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.images !== undefined){
let data6 = data.images;
const _errs13 = errors;
if(errors === _errs13){
if(Array.isArray(data6)){
var valid1 = true;
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
const _errs15 = errors;
if(typeof data6[i0] !== "string"){
validate14.errors = [{instancePath:instancePath+"/images/" + i0,schemaPath:"#/properties/images/items/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid1 = _errs15 === errors;
if(!valid1){
break;
}
}
}
else {
validate14.errors = [{instancePath:instancePath+"/images",schemaPath:"#/properties/images/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs13 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.hasVariants !== undefined){
const _errs17 = errors;
if(typeof data.hasVariants !== "boolean"){
validate14.errors = [{instancePath:instancePath+"/hasVariants",schemaPath:"#/properties/hasVariants/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid0 = _errs17 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.status !== undefined){
let data9 = data.status;
const _errs19 = errors;
if(typeof data9 !== "string"){
validate14.errors = [{instancePath:instancePath+"/status",schemaPath:"#/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
if(!((((data9 === "DRAFT") || (data9 === "ACTIVE")) || (data9 === "ARCHIVED")) || (data9 === "OUT_OF_STOCK"))){
validate14.errors = [{instancePath:instancePath+"/status",schemaPath:"#/properties/status/enum",keyword:"enum",params:{allowedValues: schema17.properties.status.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid0 = _errs19 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.isBlocked !== undefined){
const _errs21 = errors;
if(typeof data.isBlocked !== "boolean"){
validate14.errors = [{instancePath:instancePath+"/isBlocked",schemaPath:"#/properties/isBlocked/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid0 = _errs21 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.rating !== undefined){
const _errs23 = errors;
if(!(typeof data.rating == "number")){
validate14.errors = [{instancePath:instancePath+"/rating",schemaPath:"#/properties/rating/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs23 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.createdAt !== undefined){
const _errs25 = errors;
if(errors === _errs25){
if(errors === _errs25){
if(!(typeof data.createdAt === "string")){
validate14.errors = [{instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs25 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.updatedAt !== undefined){
const _errs27 = errors;
if(errors === _errs27){
if(errors === _errs27){
if(!(typeof data.updatedAt === "string")){
validate14.errors = [{instancePath:instancePath+"/updatedAt",schemaPath:"#/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs27 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
else {
validate14.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate14.errors = vErrors;
return errors === 0;
}

export const validateMyProductsPageDto = validate15;
const schema18 = {"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/ProductDto"}},"total":{"type":"number"},"page":{"type":"number"},"limit":{"type":"number"},"totalPages":{"type":"number"}},"required":["items","total","page","limit","totalPages"]};

function validate15(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.items === undefined) && (missing0 = "items")) || ((data.total === undefined) && (missing0 = "total"))) || ((data.page === undefined) && (missing0 = "page"))) || ((data.limit === undefined) && (missing0 = "limit"))) || ((data.totalPages === undefined) && (missing0 = "totalPages"))){
validate15.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.items !== undefined){
let data0 = data.items;
const _errs1 = errors;
if(errors === _errs1){
if(Array.isArray(data0)){
var valid1 = true;
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
const _errs3 = errors;
const _errs4 = errors;
if(errors === _errs4){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing1;
if(((((((((((((((((((data1.id === undefined) && (missing1 = "id")) || ((data1.shopId === undefined) && (missing1 = "shopId"))) || ((data1.ownerUserId === undefined) && (missing1 = "ownerUserId"))) || ((data1.categoryId === undefined) && (missing1 = "categoryId"))) || ((data1.name === undefined) && (missing1 = "name"))) || ((data1.slug === undefined) && (missing1 = "slug"))) || ((data1.description === undefined) && (missing1 = "description"))) || ((data1.price === undefined) && (missing1 = "price"))) || ((data1.oldPrice === undefined) && (missing1 = "oldPrice"))) || ((data1.imageUrl === undefined) && (missing1 = "imageUrl"))) || ((data1.images === undefined) && (missing1 = "images"))) || ((data1.attributes === undefined) && (missing1 = "attributes"))) || ((data1.hasVariants === undefined) && (missing1 = "hasVariants"))) || ((data1.status === undefined) && (missing1 = "status"))) || ((data1.isBlocked === undefined) && (missing1 = "isBlocked"))) || ((data1.rating === undefined) && (missing1 = "rating"))) || ((data1.createdAt === undefined) && (missing1 = "createdAt"))) || ((data1.updatedAt === undefined) && (missing1 = "updatedAt"))){
validate15.errors = [{instancePath:instancePath+"/items/" + i0,schemaPath:"#/components/schemas/ProductDto/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
if(data1.id !== undefined){
const _errs6 = errors;
if(typeof data1.id !== "string"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/id",schemaPath:"#/components/schemas/ProductDto/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs6 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.shopId !== undefined){
const _errs8 = errors;
if(typeof data1.shopId !== "string"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/shopId",schemaPath:"#/components/schemas/ProductDto/properties/shopId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs8 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.ownerUserId !== undefined){
const _errs10 = errors;
if(typeof data1.ownerUserId !== "string"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/ownerUserId",schemaPath:"#/components/schemas/ProductDto/properties/ownerUserId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs10 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.name !== undefined){
const _errs12 = errors;
if(typeof data1.name !== "string"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/name",schemaPath:"#/components/schemas/ProductDto/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs12 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.slug !== undefined){
const _errs14 = errors;
if(typeof data1.slug !== "string"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/slug",schemaPath:"#/components/schemas/ProductDto/properties/slug/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs14 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.price !== undefined){
const _errs16 = errors;
if(!(typeof data1.price == "number")){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/price",schemaPath:"#/components/schemas/ProductDto/properties/price/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid3 = _errs16 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.images !== undefined){
let data8 = data1.images;
const _errs18 = errors;
if(errors === _errs18){
if(Array.isArray(data8)){
var valid4 = true;
const len1 = data8.length;
for(let i1=0; i1<len1; i1++){
const _errs20 = errors;
if(typeof data8[i1] !== "string"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/images/" + i1,schemaPath:"#/components/schemas/ProductDto/properties/images/items/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid4 = _errs20 === errors;
if(!valid4){
break;
}
}
}
else {
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/images",schemaPath:"#/components/schemas/ProductDto/properties/images/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid3 = _errs18 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.hasVariants !== undefined){
const _errs22 = errors;
if(typeof data1.hasVariants !== "boolean"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/hasVariants",schemaPath:"#/components/schemas/ProductDto/properties/hasVariants/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid3 = _errs22 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.status !== undefined){
let data11 = data1.status;
const _errs24 = errors;
if(typeof data11 !== "string"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/status",schemaPath:"#/components/schemas/ProductDto/properties/status/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
if(!((((data11 === "DRAFT") || (data11 === "ACTIVE")) || (data11 === "ARCHIVED")) || (data11 === "OUT_OF_STOCK"))){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/status",schemaPath:"#/components/schemas/ProductDto/properties/status/enum",keyword:"enum",params:{allowedValues: schema17.properties.status.enum},message:"must be equal to one of the allowed values"}];
return false;
}
var valid3 = _errs24 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.isBlocked !== undefined){
const _errs26 = errors;
if(typeof data1.isBlocked !== "boolean"){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/isBlocked",schemaPath:"#/components/schemas/ProductDto/properties/isBlocked/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid3 = _errs26 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.rating !== undefined){
const _errs28 = errors;
if(!(typeof data1.rating == "number")){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/rating",schemaPath:"#/components/schemas/ProductDto/properties/rating/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid3 = _errs28 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.createdAt !== undefined){
const _errs30 = errors;
if(errors === _errs30){
if(errors === _errs30){
if(!(typeof data1.createdAt === "string")){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/createdAt",schemaPath:"#/components/schemas/ProductDto/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid3 = _errs30 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.updatedAt !== undefined){
const _errs32 = errors;
if(errors === _errs32){
if(errors === _errs32){
if(!(typeof data1.updatedAt === "string")){
validate15.errors = [{instancePath:instancePath+"/items/" + i0+"/updatedAt",schemaPath:"#/components/schemas/ProductDto/properties/updatedAt/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid3 = _errs32 === errors;
}
else {
var valid3 = true;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
else {
validate15.errors = [{instancePath:instancePath+"/items/" + i0,schemaPath:"#/components/schemas/ProductDto/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid1 = _errs3 === errors;
if(!valid1){
break;
}
}
}
else {
validate15.errors = [{instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.total !== undefined){
const _errs34 = errors;
if(!(typeof data.total == "number")){
validate15.errors = [{instancePath:instancePath+"/total",schemaPath:"#/properties/total/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs34 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.page !== undefined){
const _errs36 = errors;
if(!(typeof data.page == "number")){
validate15.errors = [{instancePath:instancePath+"/page",schemaPath:"#/properties/page/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs36 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.limit !== undefined){
const _errs38 = errors;
if(!(typeof data.limit == "number")){
validate15.errors = [{instancePath:instancePath+"/limit",schemaPath:"#/properties/limit/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs38 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.totalPages !== undefined){
const _errs40 = errors;
if(!(typeof data.totalPages == "number")){
validate15.errors = [{instancePath:instancePath+"/totalPages",schemaPath:"#/properties/totalPages/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs40 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
else {
validate15.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate15.errors = vErrors;
return errors === 0;
}

export const validateProductVariantDto = validate16;

function validate16(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((((((data.id === undefined) && (missing0 = "id")) || ((data.productId === undefined) && (missing0 = "productId"))) || ((data.sku === undefined) && (missing0 = "sku"))) || ((data.name === undefined) && (missing0 = "name"))) || ((data.attributes === undefined) && (missing0 = "attributes"))) || ((data.price === undefined) && (missing0 = "price"))) || ((data.oldPrice === undefined) && (missing0 = "oldPrice"))) || ((data.barcode === undefined) && (missing0 = "barcode"))) || ((data.imageUrl === undefined) && (missing0 = "imageUrl"))) || ((data.isActive === undefined) && (missing0 = "isActive"))){
validate16.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.id !== undefined){
const _errs1 = errors;
if(typeof data.id !== "string"){
validate16.errors = [{instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.productId !== undefined){
const _errs3 = errors;
if(typeof data.productId !== "string"){
validate16.errors = [{instancePath:instancePath+"/productId",schemaPath:"#/properties/productId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.sku !== undefined){
const _errs5 = errors;
if(typeof data.sku !== "string"){
validate16.errors = [{instancePath:instancePath+"/sku",schemaPath:"#/properties/sku/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.isActive !== undefined){
const _errs7 = errors;
if(typeof data.isActive !== "boolean"){
validate16.errors = [{instancePath:instancePath+"/isActive",schemaPath:"#/properties/isActive/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
return false;
}
var valid0 = _errs7 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
else {
validate16.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate16.errors = vErrors;
return errors === 0;
}

export const validateCartDto = validate17;
const schema21 = {"type":"object","properties":{"id":{},"customerId":{},"sessionId":{},"items":{"type":"array","items":{"$ref":"#/components/schemas/CartItemDto"}},"totalAmount":{"type":"number"},"totalQuantity":{"type":"number"}},"required":["id","customerId","sessionId","items","totalAmount","totalQuantity"]};
const schema22 = {"type":"object","properties":{"id":{"type":"string"},"productId":{"type":"string"},"variantId":{"type":"string"},"shopId":{"type":"string"},"quantity":{"type":"number"},"unitPriceSnapshot":{"type":"number"},"lineTotal":{"type":"number"}},"required":["id","productId","variantId","shopId","quantity","unitPriceSnapshot","lineTotal"]};

function validate17(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((data.id === undefined) && (missing0 = "id")) || ((data.customerId === undefined) && (missing0 = "customerId"))) || ((data.sessionId === undefined) && (missing0 = "sessionId"))) || ((data.items === undefined) && (missing0 = "items"))) || ((data.totalAmount === undefined) && (missing0 = "totalAmount"))) || ((data.totalQuantity === undefined) && (missing0 = "totalQuantity"))){
validate17.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.items !== undefined){
let data0 = data.items;
const _errs1 = errors;
if(errors === _errs1){
if(Array.isArray(data0)){
var valid1 = true;
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
let data1 = data0[i0];
const _errs3 = errors;
const _errs4 = errors;
if(errors === _errs4){
if(data1 && typeof data1 == "object" && !Array.isArray(data1)){
let missing1;
if((((((((data1.id === undefined) && (missing1 = "id")) || ((data1.productId === undefined) && (missing1 = "productId"))) || ((data1.variantId === undefined) && (missing1 = "variantId"))) || ((data1.shopId === undefined) && (missing1 = "shopId"))) || ((data1.quantity === undefined) && (missing1 = "quantity"))) || ((data1.unitPriceSnapshot === undefined) && (missing1 = "unitPriceSnapshot"))) || ((data1.lineTotal === undefined) && (missing1 = "lineTotal"))){
validate17.errors = [{instancePath:instancePath+"/items/" + i0,schemaPath:"#/components/schemas/CartItemDto/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
return false;
}
else {
if(data1.id !== undefined){
const _errs6 = errors;
if(typeof data1.id !== "string"){
validate17.errors = [{instancePath:instancePath+"/items/" + i0+"/id",schemaPath:"#/components/schemas/CartItemDto/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs6 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.productId !== undefined){
const _errs8 = errors;
if(typeof data1.productId !== "string"){
validate17.errors = [{instancePath:instancePath+"/items/" + i0+"/productId",schemaPath:"#/components/schemas/CartItemDto/properties/productId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs8 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.variantId !== undefined){
const _errs10 = errors;
if(typeof data1.variantId !== "string"){
validate17.errors = [{instancePath:instancePath+"/items/" + i0+"/variantId",schemaPath:"#/components/schemas/CartItemDto/properties/variantId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs10 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.shopId !== undefined){
const _errs12 = errors;
if(typeof data1.shopId !== "string"){
validate17.errors = [{instancePath:instancePath+"/items/" + i0+"/shopId",schemaPath:"#/components/schemas/CartItemDto/properties/shopId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid3 = _errs12 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.quantity !== undefined){
const _errs14 = errors;
if(!(typeof data1.quantity == "number")){
validate17.errors = [{instancePath:instancePath+"/items/" + i0+"/quantity",schemaPath:"#/components/schemas/CartItemDto/properties/quantity/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid3 = _errs14 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.unitPriceSnapshot !== undefined){
const _errs16 = errors;
if(!(typeof data1.unitPriceSnapshot == "number")){
validate17.errors = [{instancePath:instancePath+"/items/" + i0+"/unitPriceSnapshot",schemaPath:"#/components/schemas/CartItemDto/properties/unitPriceSnapshot/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid3 = _errs16 === errors;
}
else {
var valid3 = true;
}
if(valid3){
if(data1.lineTotal !== undefined){
const _errs18 = errors;
if(!(typeof data1.lineTotal == "number")){
validate17.errors = [{instancePath:instancePath+"/items/" + i0+"/lineTotal",schemaPath:"#/components/schemas/CartItemDto/properties/lineTotal/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid3 = _errs18 === errors;
}
else {
var valid3 = true;
}
}
}
}
}
}
}
}
}
else {
validate17.errors = [{instancePath:instancePath+"/items/" + i0,schemaPath:"#/components/schemas/CartItemDto/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
var valid1 = _errs3 === errors;
if(!valid1){
break;
}
}
}
else {
validate17.errors = [{instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.totalAmount !== undefined){
const _errs20 = errors;
if(!(typeof data.totalAmount == "number")){
validate17.errors = [{instancePath:instancePath+"/totalAmount",schemaPath:"#/properties/totalAmount/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs20 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.totalQuantity !== undefined){
const _errs22 = errors;
if(!(typeof data.totalQuantity == "number")){
validate17.errors = [{instancePath:instancePath+"/totalQuantity",schemaPath:"#/properties/totalQuantity/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs22 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
else {
validate17.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate17.errors = vErrors;
return errors === 0;
}

export const validateFavoritesPageDto = validate18;
const schema23 = {"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/FavoriteDto"}},"total":{"type":"number"},"page":{"type":"number"},"limit":{"type":"number"},"totalPages":{"type":"number"}},"required":["items","total","page","limit","totalPages"]};
const schema24 = {"type":"object","properties":{"id":{"type":"string"},"userId":{},"sessionId":{},"productId":{"type":"string"},"product":{"$ref":"#/components/schemas/StorefrontProductDto"},"createdAt":{"format":"date-time","type":"string"}},"required":["id","userId","sessionId","productId","product","createdAt"]};

function validate19(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if(((((((data.id === undefined) && (missing0 = "id")) || ((data.userId === undefined) && (missing0 = "userId"))) || ((data.sessionId === undefined) && (missing0 = "sessionId"))) || ((data.productId === undefined) && (missing0 = "productId"))) || ((data.product === undefined) && (missing0 = "product"))) || ((data.createdAt === undefined) && (missing0 = "createdAt"))){
validate19.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.id !== undefined){
const _errs1 = errors;
if(typeof data.id !== "string"){
validate19.errors = [{instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.productId !== undefined){
const _errs3 = errors;
if(typeof data.productId !== "string"){
validate19.errors = [{instancePath:instancePath+"/productId",schemaPath:"#/properties/productId/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
var valid0 = _errs3 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.product !== undefined){
const _errs5 = errors;
if(!(validate11(data.product, {instancePath:instancePath+"/product",parentData:data,parentDataProperty:"product",rootData}))){
vErrors = vErrors === null ? validate11.errors : vErrors.concat(validate11.errors);
errors = vErrors.length;
}
var valid0 = _errs5 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.createdAt !== undefined){
const _errs6 = errors;
if(errors === _errs6){
if(errors === _errs6){
if(!(typeof data.createdAt === "string")){
validate19.errors = [{instancePath:instancePath+"/createdAt",schemaPath:"#/properties/createdAt/type",keyword:"type",params:{type: "string"},message:"must be string"}];
return false;
}
}
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
else {
validate19.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate19.errors = vErrors;
return errors === 0;
}


function validate18(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(errors === 0){
if(data && typeof data == "object" && !Array.isArray(data)){
let missing0;
if((((((data.items === undefined) && (missing0 = "items")) || ((data.total === undefined) && (missing0 = "total"))) || ((data.page === undefined) && (missing0 = "page"))) || ((data.limit === undefined) && (missing0 = "limit"))) || ((data.totalPages === undefined) && (missing0 = "totalPages"))){
validate18.errors = [{instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: missing0},message:"must have required property '"+missing0+"'"}];
return false;
}
else {
if(data.items !== undefined){
let data0 = data.items;
const _errs1 = errors;
if(errors === _errs1){
if(Array.isArray(data0)){
var valid1 = true;
const len0 = data0.length;
for(let i0=0; i0<len0; i0++){
const _errs3 = errors;
if(!(validate19(data0[i0], {instancePath:instancePath+"/items/" + i0,parentData:data0,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate19.errors : vErrors.concat(validate19.errors);
errors = vErrors.length;
}
var valid1 = _errs3 === errors;
if(!valid1){
break;
}
}
}
else {
validate18.errors = [{instancePath:instancePath+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type: "array"},message:"must be array"}];
return false;
}
}
var valid0 = _errs1 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.total !== undefined){
const _errs4 = errors;
if(!(typeof data.total == "number")){
validate18.errors = [{instancePath:instancePath+"/total",schemaPath:"#/properties/total/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs4 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.page !== undefined){
const _errs6 = errors;
if(!(typeof data.page == "number")){
validate18.errors = [{instancePath:instancePath+"/page",schemaPath:"#/properties/page/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs6 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.limit !== undefined){
const _errs8 = errors;
if(!(typeof data.limit == "number")){
validate18.errors = [{instancePath:instancePath+"/limit",schemaPath:"#/properties/limit/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs8 === errors;
}
else {
var valid0 = true;
}
if(valid0){
if(data.totalPages !== undefined){
const _errs10 = errors;
if(!(typeof data.totalPages == "number")){
validate18.errors = [{instancePath:instancePath+"/totalPages",schemaPath:"#/properties/totalPages/type",keyword:"type",params:{type: "number"},message:"must be number"}];
return false;
}
var valid0 = _errs10 === errors;
}
else {
var valid0 = true;
}
}
}
}
}
}
}
else {
validate18.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
return false;
}
}
validate18.errors = vErrors;
return errors === 0;
}
