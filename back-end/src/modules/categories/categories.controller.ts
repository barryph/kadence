import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsAuthedGuard } from '../authentication/is-authed.guard';
import { CategoriesService } from './services/categories.service';
import CreateCategoryDTO from './dtos/createCategory.dto';
import { UserDTO } from '../users/mappers/userMap';
import { ApiBody } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('/')
  @UseGuards(IsAuthedGuard)
  @ApiBody({
    type: CreateCategoryDTO,
    examples: {
      categoryExample: {
        summary: 'Create a new category',
        value: {
          name: 'Health',
          color: '#FF0000',
        },
      },
    },
  })
  async create(
    @Req() req: Request,
    @Body() createCategoryDto: CreateCategoryDTO,
  ) {
    const userId = (req.user as UserDTO).id;
    const category = await this.categoriesService.create(
      createCategoryDto,
      userId,
    );

    return {
      data: {
        category,
      },
    };
  }

  @Put('/edit/:categoryId')
  @UseGuards(IsAuthedGuard)
  @ApiBody({
    type: CreateCategoryDTO,
    examples: {
      categoryExample: {
        summary: 'Update an existing category',
        value: {
          name: 'Health',
          color: '#FF0000',
        },
      },
    },
  })
  async edit(
    @Req() req: Request,
    @Param('categoryId') categoryId: string,
    @Body() createCategoryDto: CreateCategoryDTO,
  ) {
    const userId = (req.user as UserDTO).id;
    const category = await this.categoriesService.edit(
      categoryId,
      createCategoryDto,
      userId,
    );

    return {
      data: {
        category,
      },
    };
  }

  @Get('/')
  @UseGuards(IsAuthedGuard)
  async getAllByUserId(@Req() req: Request) {
    const userId = (req.user as UserDTO).id;
    const categories = await this.categoriesService.getAllByUserId(userId);
    return {
      data: {
        categories,
      },
    };
  }

  @Delete('/:categoryId')
  @UseGuards(IsAuthedGuard)
  async delete(@Req() req: Request, @Param('categoryId') categoryId: string) {
    const userId = (req.user as UserDTO).id;
    await this.categoriesService.delete(categoryId, userId);

    return {
      data: {
        id: categoryId,
      },
    };
  }
}
