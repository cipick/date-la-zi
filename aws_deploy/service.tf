resource "aws_ecs_cluster" "app" {
  name = local.name

  tags = {
    Name = local.name
  }
}

#################################################
# Execution Role
#################################################

resource "aws_iam_role_policy_attachment" "ecr_and_logs" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_execution" {
  name = "${local.name}-ecs_execution"

  assume_role_policy = <<DOCUMENT
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": [
          "ecs-tasks.amazonaws.com"
        ]
      }
    }
  ]
}
DOCUMENT
}

#################################################
# Services
#################################################

module "front-end" {
  source = "./service"

  name = "front-end"

  cluster         = aws_ecs_cluster.app.id
  vpc_id          = aws_vpc.main.id
  subnets         = aws_subnet.private.*.id
  lb-subnets      = aws_subnet.public.*.id
  security_groups = [aws_security_group.intra.id]
  lb-security_groups = [
    aws_security_group.intra.id,
    aws_security_group.public.id
  ]

  container_port        = 80
  execution_role_arn    = aws_iam_role.ecs_execution.arn
  image                 = var.IMAGE_FRONTEND
  prefix                = local.name
  environment_variables = <<ENV
  [
    {
      "name" : "REACT_APP_API_URL",
      "value" : "http://${module.api.dns}/api/v1"
    }
  ]
ENV
}

module "api" {
  source = "./service"

  name = "api"

  cluster         = aws_ecs_cluster.app.id
  vpc_id          = aws_vpc.main.id
  subnets         = aws_subnet.private.*.id
  lb-subnets      = aws_subnet.public.*.id
  security_groups = [aws_security_group.intra.id]
  lb-security_groups = [
    aws_security_group.intra.id,
    aws_security_group.public.id
  ]

  container_port        = 80
  execution_role_arn    = aws_iam_role.ecs_execution.arn
  image                 = var.IMAGE_API
  prefix                = local.name
  environment_variables = <<ENV
  [
    {
      "name" : "HTTPFILESERVICEOPTIONS__JSONFILEURL",
      "value" : "https://${aws_s3_bucket.storage.bucket_regional_domain_name}/latestData.json"
    }
  ]
ENV
}

module "parser" {
  source = "./service"

  name = "parser"

  cluster         = aws_ecs_cluster.app.id
  vpc_id          = aws_vpc.main.id
  subnets         = aws_subnet.private.*.id
  lb-subnets      = aws_subnet.public.*.id
  security_groups = [aws_security_group.intra.id]
  lb-security_groups = [
    aws_security_group.intra.id,
    aws_security_group.public.id
  ]

  container_port        = 8080
  execution_role_arn    = aws_iam_role.ecs_execution.arn
  image                 = var.IMAGE_PARSER
  prefix                = local.name
  environment_variables = <<ENV
  [
    {
      "name" : "AWS__APIKEY",
      "value" : "${aws_iam_access_key.parser.id}"
    },
    {
      "name" : "AWS__SECRET",
      "value" : "${aws_iam_access_key.parser.secret}"
    },
    {
      "name" : "AWS__BUCKETNAME",
      "value" : "${aws_s3_bucket.storage.bucket}"
    },
    {
      "name" : "AWS__REGION",
      "value" : "${aws_s3_bucket.storage.region}"
    }
  ]
ENV
}