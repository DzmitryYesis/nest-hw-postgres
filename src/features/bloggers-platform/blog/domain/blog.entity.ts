import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BlogInputDto, CreateBlogDomainDto } from '../dto';
import { HydratedDocument, Model } from 'mongoose';
import { BlogStatusEnum } from '../../../../constants';

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  websiteUrl: string;

  @Prop({ required: true, type: Boolean, default: false })
  isMembership: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ enum: BlogStatusEnum, default: BlogStatusEnum.ACTIVE })
  blogStatus: BlogStatusEnum;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    return blog as BlogDocument;
  }

  updateBlog(dto: BlogInputDto): void {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }

  deleteBlog(): void {
    this.blogStatus = BlogStatusEnum.DELETED;
    this.deletedAt = new Date();
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<BlogDocument> & typeof Blog;
