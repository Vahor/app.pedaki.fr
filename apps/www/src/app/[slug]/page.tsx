export default function WorkspaceHomePage({ params }: { params: { slug: string } }) {
  return <main>{params.slug}</main>;
}
