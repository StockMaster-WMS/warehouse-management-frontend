"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Phone, MapPin, Calendar, Shield, Activity, Edit, TrendingUp, Package, CheckCircle, Trophy, Star, Lightbulb } from "lucide-react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data - in real app, this would come from API/store
  const user = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "+84 123 456 789",
    role: "Quản lý kho",
    location: "Hồ Chí Minh",
    joinDate: "15/03/2023",
    avatar: "/avatars/user.jpg", // placeholder
    bio: "Chuyên viên quản lý kho với 5 năm kinh nghiệm trong lĩnh vực logistics và quản lý chuỗi cung ứng. Có kiến thức sâu về tối ưu hóa quy trình kho bãi và cải thiện hiệu suất vận hành.",
    stats: {
      totalOrders: 1247,
      activeProjects: 12,
      completedTasks: 892,
      efficiency: 94.2,
    },
    achievements: [
      { title: "Nhân viên xuất sắc Q1", date: "2024", icon: Trophy },
      { title: "Đạt KPI xuất sắc", date: "2023", icon: Star },
      { title: "Đóng góp cải tiến", date: "2023", icon: Lightbulb },
    ],
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col items-center space-y-6 md:flex-row md:items-start md:space-x-8 md:space-y-0">
          <Avatar className="size-28 border-4 border-white/20 shadow-xl transition-transform duration-200 hover:scale-105">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-3xl font-bold bg-white/10">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            <p className="text-xl opacity-90 mb-4">{user.role}</p>

            <div className="flex flex-wrap items-center justify-center gap-6 md:justify-start mb-6">
              <div className="flex items-center gap-2">
                <Mail className="size-5" />
                <span className="text-lg">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-5" />
                <span className="text-lg">{user.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-5" />
                <span className="text-lg">{user.location}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 transition-colors duration-200 px-4 py-2 text-sm">
                <Calendar className="mr-2 size-4" />
                Tham gia từ {user.joinDate}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 transition-colors duration-200 px-4 py-2 text-sm">
                <TrendingUp className="mr-2 size-4" />
                Hiệu suất: {user.stats.efficiency}%
              </Badge>
            </div>
          </div>

          <div className="md:ml-auto flex flex-col gap-3">
            <Dialog>
              <DialogTrigger>
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200 hover:shadow-md">
                  <Edit className="mr-2 size-4" />
                  Chỉnh sửa hồ sơ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Họ tên</Label>
                    <Input id="name" defaultValue={user.name} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.email} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input id="phone" defaultValue={user.phone} />
                  </div>
                  <div>
                    <Label htmlFor="bio">Giới thiệu</Label>
                    <Textarea id="bio" defaultValue={user.bio} />
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">Lưu thay đổi</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 transition-all duration-200 hover:shadow-md">
              <Shield className="mr-2 size-4" />
              Bảo mật
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-200 dark:border-emerald-800 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Package className="size-4" />
              Tổng đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">
              {user.stats.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">+12% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Activity className="size-4" />
              Dự án đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {user.stats.activeProjects}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">3 dự án sắp hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <CheckCircle className="size-4" />
              Nhiệm vụ hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {user.stats.completedTasks.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">98% đúng hạn</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <TrendingUp className="size-4" />
              Hiệu suất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-1">
              {user.stats.efficiency}%
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">+2.1% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Personal Information & Bio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Phone className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Số điện thoại</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Địa điểm</p>
                      <p className="text-sm text-muted-foreground">{user.location}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ngày tham gia</p>
                      <p className="text-sm text-muted-foreground">{user.joinDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio Section */}
          <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Giới thiệu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-base">{user.bio}</p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5" /> Thành tích
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {user.achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <Card
                      key={index}
                      className="p-4 text-center bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800"
                    >
                      <Icon className="mx-auto mb-2 h-8 w-8 text-indigo-600 dark:text-indigo-300" />
                      <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.date}</p>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security & Activity */}
          <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Bảo mật tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mật khẩu</span>
                <Button variant="outline" size="sm" className="transition-all duration-200 hover:shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20">
                  Đổi mật khẩu
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Xác thực hai yếu tố</span>
                <Badge variant="secondary" className="transition-colors duration-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Đã bật
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Phiên đăng nhập</span>
                <Button variant="outline" size="sm" className="transition-all duration-200 hover:shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20">
                  Xem tất cả
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-3 rounded-full bg-blue-500 mt-2 shadow-sm"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Cập nhật đơn hàng #1234</p>
                    <p className="text-xs text-muted-foreground">2 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-3 rounded-full bg-green-500 mt-2 shadow-sm"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Hoàn thành kiểm kê kho</p>
                    <p className="text-xs text-muted-foreground">1 ngày trước</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-3 rounded-full bg-purple-500 mt-2 shadow-sm"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Thêm sản phẩm mới</p>
                    <p className="text-xs text-muted-foreground">3 ngày trước</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-3 rounded-full bg-amber-500 mt-2 shadow-sm"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Cập nhật báo cáo hàng tuần</p>
                    <p className="text-xs text-muted-foreground">5 ngày trước</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}