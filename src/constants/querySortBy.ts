export enum UsersSortByEnum {
  CREATED_AT = 'createdAt',
  LOGIN = 'login',
  EMAIL = 'email',
}

export enum BlogsSortByEnum {
  NAME = 'name',
  DESCRIPTION = 'description',
  WEBSITE_URL = 'websiteUrl',
  CREATED_AT = 'createdAt',
}

export enum PostsSortByEnum {
  TITLE = 'title',
  SHORT_DESCRIPTION = 'shortDescription',
  CONTENT = 'content',
  BLOG_ID = 'blogId',
  BLOG_NAME = 'blogName',
  CREATED_AT = 'createdAt',
}

export enum CommentsSortByEnum {
  CONTENT = 'content',
  CREATED_AT = 'createdAt',
}

export enum SortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}
