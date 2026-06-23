terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

resource "local_file" "hello" {
  filename = "${path.module}/output/hello.txt"
  content  = "CloudAlarm drift test: version 1"
}