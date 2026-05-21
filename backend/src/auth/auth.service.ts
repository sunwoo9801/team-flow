async login(dto: LoginDto): Promise<TokenPair> {
  console.log('[login] this.prisma:', typeof this.prisma);
  console.log('[login] this.prisma?.user:', typeof this.prisma?.user);
  console.log('[login] prisma keys:', this.prisma ? Object.keys(this.prisma).slice(0, 10) : 'null');
  
  const user = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (!user || !user.password) {
    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) {
    throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  return this.generateTokens(user.id, user.email);
}