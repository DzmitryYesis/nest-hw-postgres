import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

@Injectable()
export class ObjectIdValidationTransformationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): any {
    if (metadata.metatype === Types.ObjectId) {
      if (!isValidObjectId(value)) {
        throw new BadRequestException({
          errorsMessages: [
            {
              field: 'id',
              message: `Invalid ObjectId: ${value}`,
            },
          ],
        });
      }
      return new Types.ObjectId(value);
    }

    return value;
  }
}
