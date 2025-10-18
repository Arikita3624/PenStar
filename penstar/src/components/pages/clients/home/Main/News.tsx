import { Post } from "@/mock/dataPost";
import { Pagination } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Post = {
    _id: string;
    title: string;
    content: string;
    image_url: string;
    author_name: string;
    createdAt: string;
    slug: string;
};

const News = () => {
    const [page, setPage] = useState(1);
    const pageSize = 6;
    const navigate = useNavigate();

    // const { data, isLoading } = useQuery({
    //     queryKey: ["blogs"],
    //     queryFn: async () => {
    //         const res = await instanceClient.get("/blog");
    //         return res.data;
    //     },
    // });
    const stripHTML = (html: string) => html.replace(/<[^>]+>/g, '');

    const posts: Post[] = Post || [];
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const currentPosts = posts.slice(start, end);

    return (
        <div className="max-w-screen-lg mx-auto py-16 px-4 md:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-blue-600 mb-3">
                    Tin tức mới nhất
                </h2>
                <p className="text-blue-400 max-w-xl mx-auto text-lg">
                    Tour du lịch <strong>Trong nước</strong> với{" "}
                    <strong>Elite Travel</strong>. Hành hương đầu xuân - Tận hưởng bản sắc
                    Việt.
                </p>
            </div>

            {/* {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spin size="large" />
                </div>
            ) : ( */}
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {currentPosts.map((item) => (
                            <div
                                key={item._id}
                                className="bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1"
                                onClick={() => navigate(`/blog/${item.slug}`)}
                            >
                                <div className="overflow-hidden">
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-48 object-cover transition-transform duration-500 hover:scale-110"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-blue-700 hover:underline">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(item.createdAt).toLocaleDateString()} &nbsp; | &nbsp;{" "}
                                        {item.author_name}
                                    </p>
                                    <span className="text-gray-700 mt-2 text-sm">
                                        {stripHTML(item.content || '')?.length > 100
                                            ? stripHTML(item.content || '').slice(0, 100) + "..."
                                            : stripHTML(item.content || '')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center mt-8">
                        <Pagination
                            current={page}
                            pageSize={pageSize}
                            total={posts.length}
                            onChange={(p) => setPage(p)}
                        />
                    </div>
                </>
        </div>
    );
};

export default News;